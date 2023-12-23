figma.showUI(__html__, {
  title: 'Design System Adoption',
  themeColors: true,
  width: 400,
  height: 600,
});

import config from './config-keys';

// Relaunch
figma.root.setRelaunchData({ open: '' });

const figmaFileId = config.figmaFileId;
const foundationsFileId = config.foundationsFileId;
const teamId = config.teamId;
const figmaApiToken = config.figmaApiToken;

let components;
let styles;
let libraries = [];

// Fetch components

async function fetchAllComponents(figmaFileId: string, url: string, allComponents: any[] = []) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Figma-Token': figmaApiToken,
    },
  });
  const json = await response.json();

  console.log('Components:', json);

  // Check if the response has a 'meta' property and 'components' within it
  if (json.meta && json.meta.components) {
    console.log('Accumulating Components:', json.meta.components);
    allComponents = allComponents.concat(json.meta.components);
    console.log('Total Components Accumulated:', allComponents.length);
  } else {
    console.log('No components found in the current response.');
  }

  return allComponents;
}

async function fetchAllStyles(foundationsFileId: string, url: string, allStyles: any[] = []) {
  console.log('Fetching from URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Figma-Token': figmaApiToken,
    },
  });

  if (!response.ok) {
    console.error('Error fetching data:', response.statusText);
    return;
  }

  const json = await response.json();

  console.log('Styles:', json);

  // Check if the response has a 'meta' property and 'styles' within it
  if (json.meta && json.meta.styles) {
    console.log('Accumulating Styles:', json.meta.styles);
    allStyles = allStyles.concat(json.meta.styles);
    console.log('Total Styles Accumulated:', allStyles.length);
  } else {
    console.log('No styles found in the current response.');
  }

  return allStyles;
}

async function fetchAllComponentsAndLayers(figmaFileId: string) {
  const url = `https://api.figma.com/v1/files/${figmaFileId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Figma-Token': figmaApiToken,
    },
  });

  const json = await response.json();

  console.log('Components and Layers:', json);

  return json;
}

fetchAllComponentsAndLayers(figmaFileId);

// Fetch components and styles
Promise.all([
  fetchAllComponents(figmaFileId, `https://api.figma.com/v1/files/${figmaFileId}/components?page_size=100000`),
  fetchAllStyles(foundationsFileId, `https://api.figma.com/v1/files/${foundationsFileId}/styles?page_size=100000`),
])
  .then(([fetchedComponents, fetchedStyles]) => {
    // Update the components and styles
    components = fetchedComponents;
    styles = fetchedStyles;

    // Add the fetched components and styles to the libraries
    libraries.push(fetchedComponents, fetchedStyles);

    // Log a message to the console
    console.log('About to send fetched message');

    // Send a message to the UI
    figma.ui.postMessage({ type: 'fetched', message: 'Components and styles fetched successfully.' });

    return { components, styles, libraries };
  })
  .catch((error) => {
    console.error('Error fetching components and styles:', error);

    // Send an error message to the UI
    figma.ui.postMessage({ type: 'error', message: 'Error fetching components and styles.' });
  });

// Getting all the nodes within a selection
function getNodes(nodes: readonly SceneNode[]): SceneNode[] {
  const allNodes: SceneNode[] = [];

  for (const node of nodes) {
    if (node.visible) {
      allNodes.push(node);
      if ('children' in node) {
        const childNodes = getNodes(node.children);
        allNodes.push(...childNodes);
      }
    }
  }

  return allNodes;
}

// Get node data
// function getNodeData(nodes) {
//   return nodes.map((node) => {
//     let fillStyleKey = null;
//     let textStyleKey = null;
//     if (node.fillStyleId) {
//       const fillStyle = figma.getStyleById(node.fillStyleId);
//       if (fillStyle) {
//         fillStyleKey = fillStyle.key;
//       }
//     }
//     if (node.type === 'TEXT') {
//       const textStyle = figma.getStyleById(node.textStyleId);
//       if (textStyle) {
//         textStyleKey = textStyle.key;
//       }
//     }
//     return {
//       name: node.name,
//       id: node.id,
//       type: node.type,
//       visible: node.visible,
//       hasFill: node.fills.length > 0,
//       fillStyleId: node.fillStyleId,
//       strokeStyleId: node.strokeStyleId,
//       textStyleId: node.textStyleId,
//       mainComponent: node.mainComponent,
//       parent: node.parent,
//       mainComponentKey: node.mainComponent ? node.mainComponent.key : null,
//       fillStyleKey: fillStyleKey,
//       textStyleKey: textStyleKey,
//     };
//   });
// }

function getNodeData(nodes, parentMainComponentKey = null) {
  return nodes.flatMap((node) => {
    let fillStyleKey = null;
    let textStyleKey = null;

    if (node.fillStyleId) {
      const fillStyle = figma.getStyleById(node.fillStyleId);
      if (fillStyle) {
        fillStyleKey = fillStyle.key;
      }
    }

    if (node.type === 'TEXT') {
      const textStyle = figma.getStyleById(node.textStyleId);
      if (textStyle) {
        textStyleKey = textStyle.key;
      }
    }

    let mainComponentKey = node.mainComponent ? node.mainComponent.key : null;
    let isNestedInInstance = false; // New variable to track if node is nested in an instance

    // If the node is a child of an instance and doesn't have a different main component, it comes from the library
    if (node.parent && node.parent.type === 'INSTANCE' && mainComponentKey === null) {
      mainComponentKey = node.parent.mainComponent ? node.parent.mainComponent.key : null;
      isNestedInInstance = true;
    }

    const nodeData = {
      name: node.name,
      id: node.id,
      type: node.type,
      visible: node.visible,
      hasFill: node.fills.length > 0,
      fillStyleId: node.fillStyleId,
      strokeStyleId: node.strokeStyleId,
      textStyleId: node.textStyleId,
      mainComponent: node.mainComponent,
      parent: node.parent,
      parentMainComponentKey: node.parent && node.parent.mainComponent ? node.parent.mainComponent.key : null,
      mainComponentKey: mainComponentKey,
      fillStyleKey: fillStyleKey,
      textStyleKey: textStyleKey,
      isNestedInInstance: isNestedInInstance,
    };

    return [nodeData];
  });
}

// Function to check if keys of the node match with keys from the component or style library
function checkKeys(nodeData, libraries) {
  const keys = libraries.flatMap((library) => library.map((item) => item.key));
  const nodeKeys = nodeData.flatMap((item) => [item.mainComponentKey, item.fillStyleKey, item.textStyleKey]);

  // Initialize objects to store matching keys for each type
  const matchingKeys = {
    mainComponentKeys: [],
    fillStyleKeys: [],
    textStyleKeys: [],
  };

  // For each type of key, check if it exists in the list of keys and store matching keys
  nodeKeys.forEach((key) => {
    if (keys.includes(key)) {
      if (nodeData.some((item) => item.mainComponentKey === key)) {
        matchingKeys.mainComponentKeys.push(key);
      }
      if (nodeData.some((item) => item.fillStyleKey === key)) {
        matchingKeys.fillStyleKeys.push(key);
      }
      if (nodeData.some((item) => item.textStyleKey === key)) {
        matchingKeys.textStyleKeys.push(key);
      }
    }
  });

  console.log('Keys:', keys);
  console.log('Node Keys:', nodeKeys);
  console.log('Matching Main Component Keys:', matchingKeys.mainComponentKeys);
  console.log('Matching Fill Style Keys:', matchingKeys.fillStyleKeys);
  console.log('Matching Text Style Keys:', matchingKeys.textStyleKeys);

  return matchingKeys;
}

async function checkSelection() {
  const selection = figma.currentPage.selection;
  const allNodes = getNodes(selection);

  console.log('Selection:', selection);

  if (allNodes.length > 0) {
    // Replace the mapping logic with a call to getNodeData
    const nodeData = getNodeData(allNodes);

    console.log('Node Data:', nodeData); // Log the node data
    // // Send the list of nodes to the UI
    // figma.ui.postMessage({ type: 'nodes', nodes: nodeData });
    // figma.ui.postMessage({ type: 'selection-changed' });

    console.log('Components:', components);
    console.log('Styles:', styles);

    console.log('About to call checkKeys');

    // Check if keys of the node match with keys from the fetched components and styles
    const matchingKeys = checkKeys(nodeData, [components, styles]);

    console.log('Matching Main Component Keys:', matchingKeys.mainComponentKeys.length);
    console.log('Matching Fill Style Keys:', matchingKeys.fillStyleKeys.length);
    console.log('Matching Text Style Keys:', matchingKeys.textStyleKeys.length);

    // Send the matching keys numbers to the ui
    figma.ui.postMessage({
      type: 'update-counts',
      matchingComponentsCount: matchingKeys.mainComponentKeys.length,
      matchingFillsCount: matchingKeys.fillStyleKeys.length,
      matchingTextStylesCount: matchingKeys.textStyleKeys.length,
      allTextNodesCount: nodeData.filter((node) => node.type === 'TEXT').length,
      allFillsCount: nodeData.filter((node) => node.hasFill).length,
    });

    return nodeData;
  } else {
    // Send the 'nodes-not-found' message to the UI
    figma.ui.postMessage({ type: 'nodes-not-found' });
  }
}

figma.ui.onmessage = (message) => {
  if (message.type === 'analyse') {
    checkSelection();
  }
};
// figma.on('selectionchange', async () => {
//   // Get all nodes in the current selection
//   const allNodes = figma.currentPage.selection.flatMap((node) => [node, ...node.findAll()]);

//   // Get all visible nodes
//   const visibleNodes = figma.currentPage.selection.filter((node) => node.visible);
//   const visibleFillStyles = figma.currentPage.selection.filter((node) => node.fillStyleId !== '');
//   const visibleStrokeStyles = figma.currentPage.selection.filter((node) => node.strokeStyleId !== '');
//   const visibleTextStyles = figma.currentPage.selection.filter((node) => node.textStyleId !== '');

//   let fromLibraryCount = 0;
//   let fromOtherLibrariesCount = 0;
//   let textNodesWithMatchingStyleCount = 0;

//   // Iterate over all nodes
//   for (const node of visibleNodes) {
//     // Get the source of the node
//     const nodeSource = node.mainComponent;

//     // Get the key of the node source
//     const nodeSourceKey = nodeSource ? nodeSource.key : null;

//     // Count how many nodes come from the library
//     if (nodeSourceKey) {
//       const nodesFromLibrary = components.filter((component) => component.key === nodeSourceKey);
//       const nodesFromLibraryCount = nodesFromLibrary.length;

//       if (nodesFromLibraryCount > 0) {
//         fromLibraryCount++;
//       } else {
//         fromOtherLibrariesCount++;
//       }
//     }

//     // // Get all the used styles in all the visible nodes
//     // const nodeFillStyleId = node.fillStyleId;
//     // const nodeStrokeStyleId = node.strokeStyleId;
//     // const nodeTextStyleId = node.textStyleId;

//     // // Check the keys of the used styles against the keys of the styles in the library
//     // const matchingFillStyles = styles.filter((style) => style.key === nodeFillStyleId);
//   }

//   console.log('From the library: ' + fromLibraryCount);
//   console.log('From other libraries: ' + fromOtherLibrariesCount);
//   console.log('Text nodes with matching style: ' + textNodesWithMatchingStyleCount);
//   console.log('Total nodes: ' + visibleNodes.length);

//   // Calculate the score
//   let score = 0;
//   if (allNodes.length > 0) {
//     score = (fromLibraryCount / allNodes.length) * 100;
//   }
//   console.log('Score: ' + score.toFixed(2) + '%');

//   // Send a message to the UI with the score and counts
//   figma.ui.postMessage({
//     type: 'update-counts',
//     score: score.toFixed(2),
//     fromLibraryCount,
//     fromOtherLibrariesCount,
//   });
// });

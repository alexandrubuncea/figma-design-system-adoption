import React, { useEffect } from 'react';
import '../styles/ui.css';

function App() {
  const [matchingComponentsCount, setMatchingComponentsCount] = React.useState(0);
  const [matchingFillsCount, setMatchingFillsCount] = React.useState(0);
  const [matchingTextStylesCount, setMatchingTextStylesCount] = React.useState(0);
  const [allTextNodesCount, setAllTextNodesCount] = React.useState(0);
  const [allFillsCount, setAllFillsCount] = React.useState(0);
  const [isLibrariesFetched, setIsLibraryFetched] = React.useState(false);
  const [isAnalysing, setIsAnalysing] = React.useState(false);
  const textPercentage = ((matchingTextStylesCount / allTextNodesCount) * 100).toFixed(0);
  const fillsPercentage = ((matchingFillsCount / allFillsCount) * 100).toFixed(0);

  useEffect(() => {
    // Listen for messages from the plugin
    window.addEventListener('message', handleMessage);

    // Clean up the event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    const {
      type,
      matchingComponentsCount,
      matchingFillsCount,
      matchingTextStylesCount,
      allTextNodesCount,
      allFillsCount,
    } = event.data.pluginMessage;

    if (type === 'update-counts') {
      // Handle the score and counts here
      // For example, you might set state variables or update the UI directly

      setMatchingComponentsCount(matchingComponentsCount);
      setMatchingFillsCount(matchingFillsCount);
      setMatchingTextStylesCount(matchingTextStylesCount);
      setAllTextNodesCount(allTextNodesCount);
      setAllFillsCount(allFillsCount);
      setIsAnalysing(false);
    } else if (type === 'fetched') {
      setIsLibraryFetched(true);
      console.log('Libraries loaded');
    }
  };

  const handleAnalyseClick = () => {
    setIsAnalysing(true);
    parent.postMessage({ pluginMessage: { type: 'analyse' } }, '*');
    console.log('Analyse clicked');
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full justify-between">
      {isLibrariesFetched ? (
        <div className="flex flex-col gap-4">
          <div className=" flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Design System Adoption</h1>
            <p className="text-sm text-neutral-700">
              Analyse your design to see how many components, text styles and fill styles are used from your design
              system.
            </p>
          </div>
          <div className="flex flex-col divide-y border-2 border-neutral-100 rounded-lg">
            <div className="px-4 py-2 w-full flex flex-row justify-between items-center ">
              <div>
                <p className="text-lg font-bold">Component adoption</p>
                {isAnalysing ? (
                  <div className="animate-pulse h-5 bg-neutral-100 rounded w-2/4"></div>
                ) : (
                  <p className="text-sm text-neutral-700">{matchingComponentsCount} nodes</p>
                )}
              </div>
            </div>
            <div className="px-4 py-2 w-full flex flex-row justify-between items-center">
              <div>
                <p className="text-lg font-bold">Fill styles adoption</p>
                {isAnalysing ? (
                  <div className="animate-pulse h-5 bg-neutral-100 rounded w-2/4"></div>
                ) : (
                  <p className="text-sm text-neutral-700">
                    {matchingFillsCount} / {allFillsCount} of fill nodes
                  </p>
                )}
              </div>
              <div>
                {isAnalysing ? (
                  <div className="animate-pulse h-8 bg-neutral-100 rounded w-16"></div>
                ) : (
                  <p className="text-2xl font-bold">{fillsPercentage}%</p>
                )}
              </div>
            </div>
            <div className="px-4 py-2 w-full flex flex-row justify-between items-center">
              <div>
                <p className="text-lg font-bold">Text styles adoption</p>
                {isAnalysing ? (
                  <div className="animate-pulse h-5 bg-neutral-100 rounded w-2/4"></div>
                ) : (
                  <p className="text-sm text-neutral-700">
                    {matchingTextStylesCount} / {allTextNodesCount} of text nodes
                  </p>
                )}
              </div>
              <div>
                {isAnalysing ? (
                  <div className="animate-pulse h-8 bg-neutral-100 rounded w-16"></div>
                ) : (
                  <p className="text-2xl font-bold">{textPercentage}%</p>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`px-4 py-3 flex flex-row items-center justify-center w-full rounded-full font-bold text-white ${
              isAnalysing ? 'bg-purple-900' : 'bg-purple-600 hover:bg-purple-700'
            } cursor-pointer relative`}
            onClick={handleAnalyseClick}
            disabled={isAnalysing}
          >
            {isAnalysing ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Analyse design'
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="h-6 bg-neutral-100 rounded w-1/2"></div>
              <div className="h-4 bg-neutral-100 rounded w-full"></div>
              <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
            </div>
            <div className="flex flex-col divide-y border-2 border-neutral-100 rounded-lg">
              <div className="px-4 py-2 w-full flex flex-row justify-between items-center h-16">
                <div>
                  <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                  <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                </div>
              </div>
              <div className="px-4 py-2 w-full flex flex-row justify-between items-center h-16">
                <div>
                  <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                  <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                </div>
                <div>
                  <div className="h-6 bg-neutral-100 rounded w-1/4"></div>
                </div>
              </div>
              <div className="px-4 py-2 w-full flex flex-row justify-between items-center h-16">
                <div>
                  <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                  <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                </div>
                <div>
                  <div className="h-6 bg-neutral-100 rounded w-1/4"></div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 w-full rounded-full bg-neutral-100 h-12 cursor-pointer"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

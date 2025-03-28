import React, { useState, useEffect } from 'react';
import { testFirebaseConfig } from '../utils/checkFirebase';
import { getAppDiagnostics } from '../utils/appDiagnostics';

// Simple X icon component to replace Heroicons dependency
const XIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5" 
    viewBox="0 0 20 20" 
    fill="currentColor"
  >
    <path 
      fillRule="evenodd" 
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
      clipRule="evenodd" 
    />
  </svg>
);

/**
 * Component to display database status and errors
 * @param {Object} props - Component props
 * @param {boolean} props.initialized - Whether the database is initialized
 * @param {string|null} props.error - Error message if initialization failed
 * @returns {JSX.Element|null} - The rendered component or null if no errors
 */
const DatabaseStatus = ({ initialized, error }) => {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Run Firebase test when component mounts if there's an error
  useEffect(() => {
    if (error && !testResults && !testing) {
      runFirebaseTest();
    }
  }, [error]);

  const runFirebaseTest = async () => {
    setTesting(true);
    try {
      const results = await testFirebaseConfig();
      setTestResults(results);
      
      // Also run the full app diagnostics
      const diagnostics = await getAppDiagnostics();
      console.log('App diagnostics:', diagnostics);
      
      // Add the full diagnostics to the testResults
      setTestResults({
        ...results,
        appDiagnostics: diagnostics
      });
    } catch (err) {
      console.error('Error running Firebase test:', err);
    } finally {
      setTesting(false);
    }
  };

  // If database is initialized and there's no error, or if the message was dismissed, don't show anything
  if ((initialized && !error) || dismissed) {
    return null;
  }

  const renderDiagnostics = () => {
    if (!testResults || !testResults.diagnostics) return null;
    
    const { diagnostics } = testResults;
    
    return (
      <div className="mt-2 text-xs bg-gray-100 p-2 rounded text-gray-800">
        <h4 className="font-bold mb-1">Technical Details:</h4>
        <pre className="whitespace-pre-wrap overflow-auto max-h-40 text-xs bg-gray-200 p-1 rounded">
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      </div>
    );
  };

  const renderTroubleshootingHelp = () => {
    if (!showHelp) return null;
    
    return (
      <div className="mt-3 text-xs bg-blue-100 p-3 rounded text-blue-800">
        <h4 className="font-bold mb-1">Troubleshooting:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>Check your internet connection</li>
          <li>Make sure you're not blocked by a firewall</li>
          <li>Try refreshing the page</li>
          <li>Clear your browser cache</li>
          <li>Check if Firebase is operational at <a href="https://status.firebase.google.com/" className="underline" target="_blank" rel="noopener noreferrer">status.firebase.google.com</a></li>
          <li>Try a different browser</li>
          <li>Check browser console for additional error messages (F12)</li>
        </ul>
      </div>
    );
  };

  return (
    <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 ${
      error ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-start">
        <div className="flex-1">
          {error ? (
            <>
              <h3 className="text-sm font-medium text-red-800">Database Connection Issue</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <p className="mt-2 text-xs text-red-600">
                Your data may not save properly. Please ensure you have an internet connection.
              </p>
              
              <div className="mt-3 flex space-x-2">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-red-600 underline"
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-red-600 underline"
                >
                  {showHelp ? 'Hide Help' : 'Show Help'}
                </button>
              </div>

              {showDetails && (
                <div className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded">
                  {testing ? (
                    <p>Testing Firebase configuration...</p>
                  ) : testResults ? (
                    <div>
                      <p><strong>Firebase Initialized:</strong> {testResults.initialized ? 'Yes' : 'No'}</p>
                      <p><strong>Firestore Connection:</strong> {testResults.firestore ? 'Success' : 'Failed'}</p>
                      <p><strong>Authentication:</strong> {testResults.auth ? 'Success' : 'Failed'}</p>
                      <p><strong>Collections Access:</strong></p>
                      <ul className="list-disc ml-4">
                        <li>User Profiles: {testResults.profilesCollection ? 'Yes' : 'No'}</li>
                        <li>Food Entries: {testResults.foodEntriesCollection ? 'Yes' : 'No'}</li>
                      </ul>
                      {testResults.error && <p><strong>Error:</strong> {testResults.error}</p>}
                      
                      {renderDiagnostics()}
                      
                      <div className="mt-2">
                        <button 
                          onClick={runFirebaseTest}
                          className="px-2 py-1 bg-red-200 text-red-800 rounded"
                        >
                          Run Test Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={runFirebaseTest}
                      className="px-2 py-1 bg-red-200 text-red-800 rounded"
                    >
                      Test Firebase Configuration
                    </button>
                  )}
                </div>
              )}
              
              {renderTroubleshootingHelp()}
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-yellow-800">Database Warning</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Database initialization is incomplete. Some features may be limited.
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          className={`ml-3 inline-flex ${
            error ? 'text-red-500 hover:text-red-700' : 'text-yellow-500 hover:text-yellow-700'
          }`}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};

export default DatabaseStatus; 
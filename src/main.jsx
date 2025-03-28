import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initializeDatabase from './data/databaseSetup';
import { checkEmulators, startEmulators } from './utils/emulatorCheck';
import { testFirebaseConfig } from './utils/checkFirebase';
import { ensureDemoUserExists } from './auth';

// Create a wrapper component to initialize the database
const AppWithDatabaseInit = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emulatorsStatus, setEmulatorsStatus] = useState(null);

  // Initialize the database
  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('Starting database initialization...');
        
        // First test Firebase connection
        const firebaseTest = await testFirebaseConfig();
        console.log('Firebase test results:', firebaseTest);
        
        if (!firebaseTest.firestore) {
          throw new Error('Could not connect to Firebase. Please check your internet connection or Firebase configuration.');
        }
        
        // If Firebase is accessible, proceed with database initialization
        const success = await initializeDatabase();
        
        console.log('Database initialization completed with result:', success);
        setDbInitialized(success);
        
        if (!success) {
          setDbError('Failed to initialize database. Some features may not work properly.');
        }

        if (success) {
          await ensureDemoUserExists();
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        setDbInitialized(false);
        setDbError(error.message || 'Unknown error initializing Firebase');
      } finally {
        // Always set loading to false, even if there was an error
        setIsLoading(false);
      }
    };

    initDb();
  }, []);

  // Skip initialization if taking too long (10 seconds)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Database initialization taking too long, allowing user to proceed...');
        setIsLoading(false);
        if (!dbError) {
          setDbError('Database initialization timeout. Try refreshing the page if features are not working.');
        }
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [isLoading, dbError]);

  // Show loading state while database is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Initializing Application</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait while we set up the application...</p>
          
          <button 
            onClick={() => setIsLoading(false)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Skip Initialization
          </button>
        </div>
      </div>
    );
  }

  // Render the main app
  return <App dbInitialized={dbInitialized} dbError={dbError} />;
};

// Create root and render
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithDatabaseInit />
  </React.StrictMode>
);

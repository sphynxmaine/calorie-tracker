// src/utils/emulatorCheck.js
// Utility to check if Firebase emulators are running

/**
 * Check if Firebase emulators are running
 * @returns {Promise<Object>} - Status of emulators
 */
export const checkEmulators = async () => {
  const result = {
    auth: false,
    firestore: false
  };
  
  // Check Auth emulator
  try {
    const authResponse = await fetch('http://localhost:9099/', { 
      method: 'GET',
      mode: 'no-cors' // This will prevent CORS errors but also make the response opaque
    });
    
    // If we get here, the request didn't throw, so the emulator is likely running
    result.auth = true;
    console.log('Auth emulator appears to be running');
  } catch (error) {
    console.warn('Auth emulator check failed:', error);
  }
  
  // Check Firestore emulator
  try {
    const firestoreResponse = await fetch('http://localhost:8080/', { 
      method: 'GET',
      mode: 'no-cors' // This will prevent CORS errors but also make the response opaque
    });
    
    // If we get here, the request didn't throw, so the emulator is likely running
    result.firestore = true;
    console.log('Firestore emulator appears to be running');
  } catch (error) {
    console.warn('Firestore emulator check failed:', error);
  }
  
  return result;
};

/**
 * Start Firebase emulators if not running
 * This is just a helper function to show instructions to the user
 */
export const startEmulators = () => {
  console.log('Firebase emulators are not running. Please start them with:');
  console.log('firebase emulators:start');
  
  // Show alert in development
  if (process.env.NODE_ENV === 'development') {
    alert(`
Firebase emulators are not running. 

To start them:
1. Open a new terminal
2. Navigate to your project directory
3. Run: firebase emulators:start

Or you can continue without emulators, but some features may not work properly.
    `);
  }
};

export default { checkEmulators, startEmulators }; 
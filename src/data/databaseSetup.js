// src/data/databaseSetup.js
// This file handles database initialization and setup

import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  doc, 
  setDoc, 
  serverTimestamp,
  getFirestore,
  connectFirestoreEmulator
} from 'firebase/firestore';

// Collection names
export const COLLECTIONS = {
  SHARED_FOODS: 'sharedFoods',
  USER_FOODS: 'userFoods',
  FOOD_ENTRIES: 'foodEntries',
  USER_PROFILES: 'userProfiles',
  SYSTEM_CONFIG: 'systemConfig'
};

// Export collection names for use in other files
export const COLLECTION_NAMES = {
  sharedFoods: 'sharedFoods',
  userFoods: 'userFoods', 
  foodEntries: 'foodEntries',
  userProfiles: 'userProfiles',
  systemConfig: 'systemConfig'
};

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Initialize the database by checking if collections exist
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...', { isDevelopment });
    
    // Connect to Firestore emulator in development mode if on localhost
    // Disabled to prevent connection issues
    /*
    if (isDevelopment && window.location.hostname === 'localhost') {
      try {
        console.log('Attempting to connect to Firestore emulator...');
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore emulator');
      } catch (emulatorError) {
        console.warn('Failed to connect to Firestore emulator:', emulatorError);
        console.log('Continuing with cloud Firestore');
      }
    }
    */
    
    // Check if Firestore is accessible with a timeout
    try {
      console.log('Testing Firestore connection...');
      
      // Create a promise that will timeout after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore connection timeout')), 5000);
      });
      
      // Race the test query against the timeout
      const testQuery = query(collection(db, 'test-connection'), limit(1));
      await Promise.race([getDocs(testQuery), timeoutPromise]);
      
      console.log('Firestore connection successful');
    } catch (connectionError) {
      // If it's a timeout error, we'll just log it and continue
      if (connectionError.message === 'Firestore connection timeout') {
        console.warn('Firestore connection timed out, continuing with limited functionality');
      } else {
        console.error('Error connecting to Firestore:', connectionError);
        
        // For specific Firebase errors, log helpful messages
        if (connectionError.code === 'permission-denied') {
          console.error('Firebase permission denied. Check your security rules.');
        } else if (connectionError.code === 'unavailable') {
          console.error('Firebase service is unavailable. Check your internet connection.');
        } else if (connectionError.code === 'unauthenticated') {
          console.error('Firebase authentication required.');
        }
        
        // Continue anyway, as we'll try to create the collections
      }
    }
    
    // Attempt to initialize collections, but with timeout protection
    try {
      // Create a promise that will timeout after 5 seconds
      const collectionTimeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn('Collection checks timed out, continuing with limited functionality');
          resolve({});
        }, 5000);
      });
      
      // Start collection checks
      const checkCollectionsPromise = (async () => {
        // Check if collections exist by trying to get a document from each
        const collectionsToCheck = Object.values(COLLECTIONS);
        const collectionStatus = {};
        
        console.log('Checking collections:', collectionsToCheck);
        
        for (const collectionName of collectionsToCheck) {
          try {
            console.log(`Checking collection: ${collectionName}`);
            const querySnapshot = await getDocs(query(collection(db, collectionName), limit(1)));
            collectionStatus[collectionName] = querySnapshot.size > 0;
            console.log(`Collection ${collectionName} exists:`, collectionStatus[collectionName]);
          } catch (error) {
            console.error(`Error checking collection ${collectionName}:`, error);
            collectionStatus[collectionName] = false;
          }
        }
        
        return collectionStatus;
      })();
      
      // Race the collection check against the timeout
      const collectionStatus = await Promise.race([checkCollectionsPromise, collectionTimeoutPromise]);
      
      console.log('Collection status:', collectionStatus);
    } catch (collectionError) {
      console.error('Error checking collections:', collectionError);
      // Continue anyway
    }
    
    // Create system config document if it doesn't exist
    try {
      await ensureSystemConfig();
    } catch (configError) {
      console.error('Error ensuring system config:', configError);
      // Continue anyway
    }
    
    // Return true to indicate database initialization was as successful as possible
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    // Return false to indicate database initialization failed
    return false;
  }
};

/**
 * Ensure the system config document exists
 * @returns {Promise<void>}
 */
const ensureSystemConfig = async () => {
  try {
    console.log('Ensuring system config exists...');
    const configDocRef = doc(db, COLLECTIONS.SYSTEM_CONFIG, 'appConfig');
    const configDoc = {
      version: '1.0.0',
      lastUpdated: serverTimestamp(),
      features: {
        userFoods: true,
        sharedFoods: true,
        nutritionTracking: true,
        mealPlanning: false
      },
      defaultSettings: {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 150,
        dailyCarbsGoal: 200,
        dailyFatGoal: 65
      }
    };
    
    await setDoc(configDocRef, configDoc, { merge: true });
    console.log('System config document created/updated');
  } catch (error) {
    console.error('Error ensuring system config:', error);
    throw error;
  }
};

/**
 * Create a user profile when a new user signs up
 * @param {Object} user - The Firebase user object
 * @param {Object} additionalData - Additional user data
 * @returns {Promise<void>}
 */
export const createUserProfile = async (user, additionalData = {}) => {
  if (!user) return;
  
  try {
    console.log('Creating user profile for:', user.uid);
    const userRef = doc(db, COLLECTIONS.USER_PROFILES, user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      settings: {
        dailyCalorieGoal: additionalData.dailyCalorieGoal || 2000,
        dailyProteinGoal: additionalData.dailyProteinGoal || 150,
        dailyCarbsGoal: additionalData.dailyCarbsGoal || 200,
        dailyFatGoal: additionalData.dailyFatGoal || 65,
        preferredDatabase: additionalData.preferredDatabase || 'all'
      }
    };
    
    await setDoc(userRef, userData, { merge: true });
    console.log('User profile created/updated for', user.uid);
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
};

/**
 * Update a user's last login timestamp
 * @param {Object} user - The Firebase user object
 * @returns {Promise<void>}
 */
export const updateUserLastLogin = async (user) => {
  if (!user) return;
  
  try {
    console.log('Updating last login for user:', user.uid);
    const userRef = doc(db, COLLECTIONS.USER_PROFILES, user.uid);
    await setDoc(userRef, {
      lastLogin: serverTimestamp()
    }, { merge: true });
    console.log('Last login updated for user:', user.uid);
  } catch (error) {
    console.error('Error updating user last login:', error);
  }
};

/**
 * Get the database version
 * @returns {Promise<string>} - The database version
 */
export const getDatabaseVersion = async () => {
  try {
    console.log('Getting database version...');
    const configDocRef = doc(db, COLLECTIONS.SYSTEM_CONFIG, 'appConfig');
    const configDoc = await getDocs(configDocRef);
    
    if (configDoc.exists()) {
      const version = configDoc.data().version || '0.0.0';
      console.log('Database version:', version);
      return version;
    }
    
    console.log('No database version found, returning 0.0.0');
    return '0.0.0';
  } catch (error) {
    console.error('Error getting database version:', error);
    return '0.0.0';
  }
};

// Export the initialization function
export default initializeDatabase; 
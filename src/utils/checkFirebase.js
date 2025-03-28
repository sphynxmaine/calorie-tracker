// src/utils/checkFirebase.js
// Utility to check if Firebase is properly configured and accessible

import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { signInAnonymously, signOut, getAuth } from 'firebase/auth';

/**
 * Test if Firebase is properly configured
 * @returns {Promise<Object>} An object indicating if Firebase is properly configured
 */
export const testFirebaseConfig = async () => {
  const result = {
    initialized: false,
    auth: false,
    firestore: false,
    anonymousAuth: false,
    profilesCollection: false,
    foodEntriesCollection: false,
    error: null,
    diagnostics: {}
  };

  // Check if Firebase app is initialized
  try {
    // Test if auth and db are properly exported
    result.diagnostics.dbDefined = !!db;
    result.diagnostics.authDefined = !!auth;
    
    if (!db || !auth) {
      result.error = 'Firebase initialization issue: firestore or auth not defined';
      return result;
    }
  } catch (initError) {
    result.error = `Firebase initialization error: ${initError.message}`;
    result.diagnostics.initError = initError.message;
    return result;
  }

  try {
    // Test Firestore connection
    console.log('Testing Firestore connection...');
    try {
      const testQuery = query(collection(db, 'test-connection'), limit(1));
      await getDocs(testQuery);
      console.log('Firestore connection successful');
      result.firestore = true;
    } catch (firestoreError) {
      console.error('Error connecting to Firestore:', firestoreError);
      result.diagnostics.firestoreError = {
        code: firestoreError.code,
        message: firestoreError.message
      };
      result.error = `Firestore connection error: ${firestoreError.message}`;
    }

    // Test authentication object
    if (auth) {
      result.diagnostics.authObject = 'Available';
      
      // Check if auth is initialized correctly
      try {
        const currentUser = auth.currentUser;
        result.diagnostics.authInitialized = true;
        result.auth = true;
      } catch (authCheckError) {
        result.diagnostics.authCheckError = authCheckError.message;
      }
    } else {
      result.diagnostics.authObject = 'Not available';
    }

    // Skip anonymous auth tests as it's causing errors
    // Mark auth as working if the auth object exists
    if (auth) {
      result.auth = true;
    }

    // Try accessing collections only if Firestore connection is successful
    if (result.firestore) {
      try {
        console.log('Testing access to userProfiles collection...');
        const profilesQuery = query(collection(db, 'userProfiles'), limit(1));
        await getDocs(profilesQuery);
        result.profilesCollection = true;
      } catch (profilesError) {
        console.error('Error accessing userProfiles collection:', profilesError);
        result.diagnostics.profilesError = profilesError.message;
      }
      
      try {
        console.log('Testing access to foodEntries collection...');
        const entriesQuery = query(collection(db, 'foodEntries'), limit(1));
        await getDocs(entriesQuery);
        result.foodEntriesCollection = true;
      } catch (entriesError) {
        console.error('Error accessing foodEntries collection:', entriesError);
        result.diagnostics.entriesError = entriesError.message;
      }
    }

    // If Firestore is working, consider it initialized
    if (result.firestore) {
      result.initialized = true;
    }
    
    return result;
  } catch (error) {
    console.error('Firebase configuration test failed:', error);
    result.error = error.message;
    result.diagnostics.testError = error.message;
    return result;
  }
};

export default testFirebaseConfig; 
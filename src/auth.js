// src/auth.js
// Authentication functions for the application

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, updateUserLastLogin } from './data/databaseSetup';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sign up with email/password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @param {Object} additionalData - Additional user data
 * @returns {Promise<Object>} - Firebase user object
 */
export const signUp = async (email, password, displayName, additionalData = {}) => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add display name
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile in Firestore
    await createUserProfile(userCredential.user, {
      displayName,
      ...additionalData
    });
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign in with email/password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Firebase user object
 */
export const signIn = async (email, password) => {
  try {
    console.log(`Attempting to sign in user: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', userCredential.user.uid);
    
    // Check if user has a profile
    try {
      console.log('Checking if user has a profile...');
      const userProfileRef = doc(db, 'userProfiles', userCredential.user.uid);
      const profileSnapshot = await getDoc(userProfileRef);
      
      // If no profile exists, create one
      if (!profileSnapshot.exists()) {
        console.log('No profile found for user, creating one on sign in');
        await createUserProfile(userCredential.user);
      } else {
        console.log('User profile found:', profileSnapshot.data());
      }
      
      // Update last login timestamp
      await updateUserLastLogin(userCredential.user);
    } catch (profileError) {
      console.error('Error checking/creating user profile:', profileError);
      // Continue anyway - don't block login due to profile issues
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error.code, error.message);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to sign in. Please check your email and password.';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    // Throw a more user-friendly error
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get the current authenticated user
 * @returns {Object|null} - Firebase user object or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Set authentication persistence to local
 * @returns {Promise<void>}
 */
export const setAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    throw error;
  }
};

/**
 * Set up an observer for authentication state changes
 * @param {Function} callback - Callback function to be called when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export const onAuthState = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, update last login
      updateUserLastLogin(user).catch(error => {
        console.error('Error updating last login:', error);
      });
    }
    
    // Call the provided callback
    callback(user);
  });
};

// A convenience function for the Dashboard component
export const signOutUser = logOut;

// Add a method to create a demo user if it doesn't exist
/**
 * Ensures a demo user exists for testing purposes
 * @returns {Promise<void>}
 */
export const ensureDemoUserExists = async () => {
  try {
    const demoEmail = 'demo@example.com';
    const demoPassword = 'password123';
    
    // First check if we're already signed in - if so, don't try to create the demo user
    if (auth.currentUser) {
      console.log('User already signed in, skipping demo user creation');
      return;
    }
    
    try {
      // Check if the demo user already exists
      const methods = await fetchSignInMethodsForEmail(auth, demoEmail);
      
      // If no sign-in methods exist for the email, create the demo user
      if (methods.length === 0) {
        console.log('Creating demo user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        
        // Set display name
        await updateProfile(userCredential.user, { displayName: 'Demo User' });
        
        // Create user profile with some sample data
        await createUserProfile(userCredential.user, {
          displayName: 'Demo User',
          dailyCalorieGoal: 2000,
          dailyProteinGoal: 150,
          dailyCarbsGoal: 200,
          dailyFatGoal: 65
        });
        
        console.log('Demo user created successfully');
        
        // Sign out immediately 
        await signOut(auth);
      } else {
        console.log('Demo user already exists');
      }
    } catch (error) {
      // Specific error handling for the demo user creation
      if (error.code === 'auth/email-already-in-use') {
        console.log('Demo user already exists (based on error)');
        // This is fine, the demo user exists
        return;
      }
      throw error; // Rethrow other errors
    }
  } catch (error) {
    console.error('Error ensuring demo user exists:', error);
    // Don't throw, just log - this is a convenience feature, not critical
  }
}; 
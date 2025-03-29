import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PropTypes from 'prop-types';

// Create the Auth context
const AuthContext = createContext();

// Custom hook to use the Auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Effect to handle auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    let unsubscribe = () => {};
    
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("Auth state changed:", user ? "User logged in" : "No user");
        setCurrentUser(user);
        setAuthInitialized(true);
        setError(null);
        
        if (user) {
          try {
            // Fetch user profile from Firestore
            const userDocRef = doc(db, 'userProfiles', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              console.log('User profile found:', userDoc.data());
              setUserProfile(userDoc.data());
            } else {
              console.log('No user profile found for', user.uid);
              
              // Create a basic profile if one doesn't exist
              // But preserve any existing data structure
              try {
                const newProfile = {
                  uid: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || 'User',
                  createdAt: new Date().toISOString(),
                  settings: {
                    dailyCalorieGoal: 2000,
                    dailyProteinGoal: 150,
                    dailyCarbsGoal: 200,
                    dailyFatGoal: 65
                  }
                };
                
                console.log('Creating new user profile for:', user.uid);
                await setDoc(userDocRef, newProfile, { merge: true });
                setUserProfile(newProfile);
              } catch (err) {
                console.error("Error creating user profile:", err);
              }
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Failed to load user profile');
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
          
          // We've removed the anonymous sign-in to preserve existing data
          // Users will need to explicitly sign in
        }
        
        setLoading(false);
      }, (authError) => {
        console.error("Auth state change error:", authError);
        setError("Authentication error: " + authError.message);
        setLoading(false);
        setAuthInitialized(true);
      });
    } catch (setupError) {
      console.error("Error setting up auth listener:", setupError);
      setError("Failed to initialize authentication: " + setupError.message);
      setLoading(false);
      setAuthInitialized(true);
    }

    // Cleanup subscription
    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from auth:", error);
      }
    };
  }, []);

  // Retry auth initialization if it fails
  useEffect(() => {
    if (error && !authInitialized) {
      const timer = setTimeout(() => {
        console.log("Retrying auth initialization");
        setError(null);
        setLoading(true);
        
        // Force a refresh of the auth state
        const user = auth.currentUser;
        setCurrentUser(user);
        setAuthInitialized(true);
        setLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, authInitialized]);

  // The value to be provided to consumers of this context
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    authInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {(!loading || authInitialized) && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}; 
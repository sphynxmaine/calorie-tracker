// src/utils/appDiagnostics.js
// Utility functions for diagnostics and debugging

import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { testFirebaseConfig } from './checkFirebase';

/**
 * Get app diagnostics information 
 * @returns {Promise<Object>} Diagnostics information
 */
export const getAppDiagnostics = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    network: await getNetworkInfo(),
    firebase: await getFirebaseStatus(),
    auth: await getAuthStatus(),
    localStorage: getLocalStorageStatus()
  };
  
  return diagnostics;
};

/**
 * Get browser information
 * @returns {Object} Browser information
 */
const getBrowserInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    platform: navigator.platform
  };
};

/**
 * Get network information
 * @returns {Promise<Object>} Network information
 */
const getNetworkInfo = async () => {
  const info = {
    online: navigator.onLine,
    connection: null
  };
  
  // Try to get connection info
  if (navigator.connection) {
    info.connection = {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }
  
  // Try to ping Firebase
  try {
    const startTime = performance.now();
    const response = await fetch('https://firebase.googleapis.com/v1/projects', { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    const endTime = performance.now();
    info.firebasePing = endTime - startTime;
  } catch (error) {
    info.firebasePing = 'failed';
  }
  
  return info;
};

/**
 * Get Firebase status
 * @returns {Promise<Object>} Firebase status
 */
const getFirebaseStatus = async () => {
  try {
    return await testFirebaseConfig();
  } catch (error) {
    return {
      error: error.message,
      initialized: false
    };
  }
};

/**
 * Get authentication status
 * @returns {Promise<Object>} Authentication status
 */
const getAuthStatus = async () => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ status: 'timeout', user: null });
    }, 3000);
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();
        
        if (user) {
          resolve({
            status: 'authenticated',
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              emailVerified: user.emailVerified,
              isAnonymous: user.isAnonymous,
              phoneNumber: user.phoneNumber,
              photoURL: user.photoURL
            }
          });
        } else {
          resolve({ status: 'not_authenticated', user: null });
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      resolve({ status: 'error', error: error.message });
    }
  });
};

/**
 * Get local storage status
 * @returns {Object} Local storage status
 */
const getLocalStorageStatus = () => {
  try {
    const testKey = `test_${Date.now()}`;
    localStorage.setItem(testKey, 'test');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return {
      available: true,
      working: value === 'test',
      keys: Object.keys(localStorage)
        .filter(key => key.includes('firebase'))
        .reduce((obj, key) => {
          obj[key] = localStorage.getItem(key) ? 'has-value' : 'empty';
          return obj;
        }, {})
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};

export default getAppDiagnostics; 
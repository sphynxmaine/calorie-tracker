// src/firebase.js
// Firebase configuration and initialization

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  connectAuthEmulator
} from 'firebase/auth';
import { addDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCahyldtStQ3EFODXp6mxMDwjuwzoMu91I",
  authDomain: "calorie-tracker-1b499.firebaseapp.com",
  projectId: "calorie-tracker-1b499",
  storageBucket: "calorie-tracker-1b499.appspot.com",
  messagingSenderId: "226403177723",
  appId: "1:226403177723:web:dcbfc8b034578f532a0c5e",
  measurementId: "G-RB271GGTHS"
};

// Emulator configuration
const useEmulators = false; // Disable emulators completely to fix connection issues
const emulatorConfig = {
  auth: { host: 'localhost', port: 9099 },
  firestore: { host: 'localhost', port: 8080 }
};

/**
 * Initialize Firebase app
 * @returns {Object} Firebase app instance
 */
const initializeFirebaseApp = () => {
  try {
    console.log('Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully");
    return app;
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // Show user-friendly error message
    showErrorToUser("Failed to initialize the app. Please try again later.");
    throw error;
  }
};

/**
 * Initialize Firebase Analytics
 * @param {Object} app - Firebase app instance
 * @returns {Promise<Object|null>} Analytics instance or null if not supported
 */
const initializeAnalytics = async (app) => {
  try {
    console.log('Checking if Analytics is supported...');
    const supported = await isSupported();
    if (supported) {
      const analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized successfully");
      return analytics;
    } else {
      console.log("Firebase Analytics not supported in this environment");
      return null;
    }
  } catch (error) {
    console.error("Error initializing Firebase Analytics:", error);
    return null;
  }
};

/**
 * Initialize Firestore with persistence
 * @param {Object} app - Firebase app instance
 * @returns {Object} Firestore instance
 */
const initializeFirestoreDB = (app) => {
  try {
    console.log('Initializing Firestore...');
    
    // Start with standard initialization to avoid initialization issues
    const db = getFirestore(app);
    
    // Connect to Firestore emulator if in development mode and on localhost
    if (useEmulators) {
      try {
        console.log(`Connecting to Firestore emulator at ${emulatorConfig.firestore.host}:${emulatorConfig.firestore.port}`);
        connectFirestoreEmulator(
          db, 
          emulatorConfig.firestore.host, 
          emulatorConfig.firestore.port
        );
        console.log("Connected to Firestore emulator");
      } catch (emulatorError) {
        console.error("Error connecting to Firestore emulator:", emulatorError);
      }
    }
    
    // Try enabling persistence - this is optional and shouldn't block initialization
    try {
      console.log('Enabling Firestore persistence...');
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log("Firestore persistence enabled successfully");
        })
        .catch((error) => {
          if (error.code === 'failed-precondition') {
            console.warn("Firestore persistence could not be enabled: Multiple tabs open");
          } else if (error.code === 'unimplemented') {
            console.warn("Firestore persistence not available in this browser");
          } else {
            console.error("Error enabling Firestore persistence:", error);
          }
        });
    } catch (persistenceError) {
      console.error("Error setting up persistence:", persistenceError);
      // Continue without persistence
    }
    
    console.log("Firestore initialized successfully");
    return db;
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    showErrorToUser("Failed to initialize the database. Please try again later.");
    throw error;
  }
};

/**
 * Initialize Firebase Authentication
 * @param {Object} app - Firebase app instance
 * @returns {Object} Auth instance
 */
const initializeAuth = (app) => {
  try {
    console.log('Initializing Firebase Auth...');
    const auth = getAuth(app);
    
    // Connect to Auth Emulator in development
    if (useEmulators) {
      try {
        console.log(`Connecting to Auth emulator at ${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`);
        connectAuthEmulator(
          auth, 
          `http://${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`,
          { disableWarnings: false }
        );
        console.log('Connected to Auth Emulator');
      } catch (emulatorError) {
        console.error('Failed to connect to Auth Emulator:', emulatorError);
      }
    }
    
    // Set persistence to LOCAL
    console.log('Setting Auth persistence to local...');
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Auth persistence set to local successfully");
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
      });
    
    return auth;
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    showErrorToUser("Failed to initialize authentication. Please try again later.");
    throw error;
  }
};

/**
 * Show error message to user
 * @param {string} message - Error message
 */
const showErrorToUser = (message) => {
  // This could be replaced with a proper UI notification system
  if (typeof window !== 'undefined') {
    console.error(message);
    // Only show alert in development
    if (isDevelopment) {
      alert(`Firebase Error: ${message}`);
    }
  }
};

// Initialize Firebase services
console.log('Starting Firebase initialization...');
const app = initializeFirebaseApp();
let analytics = null;
const db = initializeFirestoreDB(app);
const auth = initializeAuth(app);

// Initialize analytics asynchronously
initializeAnalytics(app).then(result => {
  analytics = result;
});

console.log('Firebase initialization complete');
console.log('Using emulators:', useEmulators);

/**
 * Standardizes food data structure to ensure consistency across the app
 * This helps prevent "Unknown Food" displays and other data inconsistencies
 * 
 * @param {Object} foodData - Raw food data from any source
 * @returns {Object} - Standardized food object
 */
export const standardizeFoodData = (foodData) => {
  if (!foodData) return null;
  
  // Create a standardized food object with all required fields
  return {
    // Use existing data or provide defaults
    id: foodData.id || foodData._id || foodData.foodId || `temp-${Date.now()}`,
    
    // Core food information
    foodName: foodData.foodName || foodData.name || foodData.displayName || "Food",
    name: foodData.foodName || foodData.name || foodData.displayName || "Food",
    displayName: foodData.foodName || foodData.name || foodData.displayName || "Food",
    
    // Serving information
    servingSize: parseFloat(foodData.servingSize) || 100,
    servingUnit: foodData.servingUnit || 'g',
    amount: parseFloat(foodData.amount || foodData.servings || 1),
    servings: parseFloat(foodData.amount || foodData.servings || 1),
    displayAmount: parseFloat(foodData.amount || foodData.servings || 1),
    
    // Nutrition information
    calories: parseFloat(foodData.calories) || 0,
    protein: parseFloat(foodData.protein) || 0,
    carbs: parseFloat(foodData.carbs) || 0,
    fat: parseFloat(foodData.fat) || 0,
    
    // Source information
    source: foodData.source || 'custom',
    country: foodData.country || 'australia',
    
    // Display text for consistent UI
    displayText: `${parseFloat(foodData.amount || foodData.servings || 1)} serving${parseFloat(foodData.amount || foodData.servings || 1) !== 1 ? 's' : ''}`,
    
    // Metadata
    createdAt: foodData.createdAt || new Date().toISOString(),
    userId: foodData.userId || null,
    
    // Preserve any additional data
    ...foodData
  };
};

/**
 * Adds a food entry to the user's food diary with standardized structure
 * 
 * @param {Object} foodData - Food data to add to diary
 * @param {String} meal - Meal type (breakfast, lunch, dinner, snacks)
 * @param {Date|String} date - Date for the entry
 * @param {String} userId - User ID
 * @returns {Promise<String>} - ID of the created document
 */
export const addFoodToDiary = async (foodData, meal, date, userId) => {
  if (!userId) {
    userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
  }
  
  // Standardize the food data
  const standardizedFood = standardizeFoodData(foodData);
  
  // Format date for Firestore
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  // Calculate nutrition based on amount
  const calculatedNutrition = {
    calories: Math.round(standardizedFood.calories * standardizedFood.amount),
    protein: parseFloat((standardizedFood.protein * standardizedFood.amount).toFixed(1)),
    carbs: parseFloat((standardizedFood.carbs * standardizedFood.amount).toFixed(1)),
    fat: parseFloat((standardizedFood.fat * standardizedFood.amount).toFixed(1))
  };
  
  // Prepare food entry data
  const foodEntry = {
    userId,
    foodId: standardizedFood.id,
    foodName: standardizedFood.foodName,
    name: standardizedFood.name,
    displayName: standardizedFood.displayName,
    servings: standardizedFood.servings,
    amount: standardizedFood.amount,
    displayAmount: standardizedFood.displayAmount,
    displayText: standardizedFood.displayText,
    calories: calculatedNutrition.calories,
    protein: calculatedNutrition.protein,
    carbs: calculatedNutrition.carbs,
    fat: calculatedNutrition.fat,
    meal: meal.toLowerCase(),
    date: dateString,
    createdAt: new Date().toISOString()
  };
  
  // Add to Firestore
  const docRef = await addDoc(collection(db, "foodEntries"), foodEntry);
  return docRef.id;
};

/**
 * Fetches user foods with standardized structure
 * Includes caching for performance improvement
 * 
 * @param {String} searchTerm - Search term (optional)
 * @param {Number} limit - Maximum number of results (default: 30)
 * @returns {Promise<Array>} - Array of standardized food objects
 */
const foodCache = {};
export const fetchFoods = async (searchTerm = '', limit = 30) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    
    // Create cache key
    const cacheKey = `${userId}_${searchTerm}_${limit}`;
    
    // Check cache first (valid for 5 minutes)
    if (foodCache[cacheKey] && foodCache[cacheKey].timestamp > Date.now() - 300000) {
      return foodCache[cacheKey].data;
    }
    
    const results = [];
    const searchTermLower = searchTerm.toLowerCase();
    
    // Query user's custom foods
    const customFoodsQuery = query(
      collection(db, "customFoods"),
      where("userId", "==", userId),
      limit(limit)
    );
    
    const customFoodsSnapshot = await getDocs(customFoodsQuery);
    
    // Add customFoods to results
    customFoodsSnapshot.forEach(doc => {
      const food = doc.data();
      if (!searchTerm || 
          food.name?.toLowerCase().includes(searchTermLower) || 
          food.foodName?.toLowerCase().includes(searchTermLower)) {
        results.push(standardizeFoodData({
          ...food,
          id: doc.id,
          source: 'custom'
        }));
      }
    });
    
    // Query approved community foods
    const communityFoodsQuery = query(
      collection(db, "userFoods"),
      where("approved", "==", true),
      limit(limit)
    );
    
    const communityFoodsSnapshot = await getDocs(communityFoodsQuery);
    
    // Add community foods to results
    communityFoodsSnapshot.forEach(doc => {
      const food = doc.data();
      if (!searchTerm || 
          food.name?.toLowerCase().includes(searchTermLower) || 
          food.foodName?.toLowerCase().includes(searchTermLower)) {
        results.push(standardizeFoodData({
          ...food,
          id: doc.id,
          source: 'community'
        }));
      }
    });
    
    // Store in cache
    foodCache[cacheKey] = {
      timestamp: Date.now(),
      data: results
    };
    
    return results;
  } catch (error) {
    console.error("Error fetching foods:", error);
    return [];
  }
};

export { analytics, db, auth };
export default app;

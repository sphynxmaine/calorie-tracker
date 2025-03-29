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
  connectFirestoreEmulator,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  connectAuthEmulator
} from 'firebase/auth';
import { addDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Your web app's Firebase configuration
// Instead of using environment variables which might be missing, use a direct configuration
const firebaseConfig = {
  apiKey: "AIzaSyCahyldtStQ3EFODXp6mxMDwjuwzoMu91I",
  authDomain: "calorie-tracker-1b499.firebaseapp.com",
  projectId: "calorie-tracker-1b499",
  storageBucket: "calorie-tracker-1b499.firebasestorage.app",
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
    // Wrap this in a try-catch to prevent initialization failures
    try {
      console.log('Setting Auth persistence to local...');
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log("Auth persistence set to local successfully");
        })
        .catch((error) => {
          console.error("Error setting auth persistence:", error);
          // Just log this error but don't throw - auth will still work
        });
    } catch (persistenceError) {
      console.error("Error setting auth persistence:", persistenceError);
      // Continue without persistence
    }
    
    return auth;
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    showErrorToUser("Failed to initialize authentication. Please try again later.");
    // Return a placeholder auth instead of throwing to prevent app from crashing
    console.warn("Returning default Auth instance to prevent app crash");
    return getAuth();
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
console.log('Starting Firebase initialization with project ID:', firebaseConfig.projectId);
let app, db, auth, functions, analytics = null;

try {
  app = initializeFirebaseApp();
  db = initializeFirestoreDB(app);
  auth = initializeAuth(app);
  functions = getFunctions(app);
  
  // Initialize analytics asynchronously
  initializeAnalytics(app).then(result => {
    analytics = result;
    console.log('Analytics initialization complete');
  }).catch(error => {
    console.warn('Analytics initialization failed, but app will continue to work:', error);
  });
  
  console.log('Firebase core services initialized successfully');
} catch (error) {
  console.error('Critical error during Firebase initialization:', error);
  showErrorToUser('There was an error connecting to our services. Some features may be limited.');
  
  // Fallback initialization to prevent the app from breaking completely
  try {
    if (!app) app = initializeApp(firebaseConfig);
    if (!db) db = getFirestore(app);
    if (!auth) auth = getAuth(app);
    if (!functions) functions = getFunctions(app);
    console.log('Fallback Firebase initialization complete');
  } catch (fallbackError) {
    console.error('Even fallback initialization failed:', fallbackError);
  }
}

console.log('Firebase initialization complete');
console.log('Using emulators:', useEmulators);

// Use emulators for local development only if explicitly enabled
if (useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('Using Firebase emulators');
}

// Utility functions for standardizing food data

/**
 * Utility function to get the display name of a food item
 * from various possible fields
 */
export const getFoodDisplayName = (food) => {
  if (!food) return 'Unknown Food';
  
  // Check possible name fields in order of priority
  return food.foodName || 
         food.name || 
         food.displayName ||
         food.food?.foodName ||
         food.food?.name ||
         food.food?.displayName ||
         'Unknown Food';
};

/**
 * Standardize a food item to ensure consistent field names
 * and formats across the application
 */
export const standardizeFoodItem = (food) => {
  if (!food) return null;
  
  // Create a base standardized food object
  const standardized = {
    id: food.id || food.food?.id || uuidv4(),
    foodName: getFoodDisplayName(food),
    calories: Number(food.calories || food.food?.calories || 0),
    protein: Number(food.protein || food.food?.protein || 0),
    carbs: Number(food.carbs || food.food?.carbs || 0),
    fat: Number(food.fat || food.food?.fat || 0),
    quantity: Number(food.quantity || food.food?.quantity || 1),
    servingSize: food.servingSize || food.food?.servingSize || 'serving',
    source: food.source || 'database'
  };
  
  // Preserve any other fields that might be useful
  if (food.isShared !== undefined) standardized.isShared = food.isShared;
  if (food.userId) standardized.userId = food.userId;
  if (food.country) standardized.country = food.country;
  if (food.createdAt) standardized.createdAt = food.createdAt;
  
  return standardized;
};

/**
 * Prepare a food entry for saving to Firestore
 * This creates a standardized format for all food entries
 */
export const prepareFoodEntry = ({ food, userId, mealType, date }) => {
  // First standardize the food item
  const standardizedFood = standardizeFoodItem(food);
  
  // Format the date string consistently
  const dateObj = date instanceof Date ? date : new Date();
  const dateString = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
  
  // Create the entry with all needed fields
  return {
    userId,
    food: standardizedFood,
    foodName: standardizedFood.foodName,
    calories: standardizedFood.calories,
    protein: standardizedFood.protein,
    carbs: standardizedFood.carbs,
    fat: standardizedFood.fat,
    quantity: standardizedFood.quantity,
    servingSize: standardizedFood.servingSize,
    mealType: mealType.toLowerCase(),
    date: dateString,
    dateFormatted,
    createdAt: serverTimestamp(),
    deleted: false,
    displayName: standardizedFood.foodName, // For backward compatibility
    id: uuidv4() // Unique ID for the entry
  };
};

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

export { analytics, db, auth, functions };
export default app;

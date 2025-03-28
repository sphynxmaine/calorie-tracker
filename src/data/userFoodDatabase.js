// userFoodDatabase.js
// This file handles interactions with user's personal food database in Firebase Firestore

import { db, auth } from '../firebase';
import { toISODateString } from '../utils/dateUtils';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Collection references
const FOOD_ENTRIES_COLLECTION = 'foodEntries';
const USER_FOODS_COLLECTION = 'userFoods';

/**
 * Add a food entry to the user's diary
 * @param {Object} foodEntry - The food entry to add
 * @returns {Promise<string>} - The ID of the new food entry
 */
export const addFoodToDiary = async (foodEntry) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to add food entries');
    }

    const { 
      date, // Date object or ISO string
      meal, // breakfast, lunch, dinner, snacks
      foodId, // ID of the food from any database
      amount, // Amount in grams or servings
      name, // Name of the food
      calories,
      protein,
      carbs,
      fat,
      source, // 'australian', 'us', 'shared', 'user'
    } = foodEntry;

    // Validate required fields
    if (!meal) throw new Error('Meal type is required');
    if (!name) throw new Error('Food name is required');
    if (calories === undefined) throw new Error('Calories are required');

    // Convert date to Firestore timestamp
    let entryDate;
    if (date instanceof Date) {
      entryDate = Timestamp.fromDate(date);
    } else if (typeof date === 'string') {
      entryDate = Timestamp.fromDate(new Date(date));
    } else {
      entryDate = Timestamp.fromDate(new Date());
    }

    // Prepare the entry
    const entry = {
      userId: auth.currentUser.uid,
      date: entryDate,
      meal,
      foodId,
      name,
      amount: Number(amount) || 0,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      source: source || 'user',
      createdAt: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, FOOD_ENTRIES_COLLECTION), entry);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding food to diary:', error);
    throw error;
  }
};

/**
 * Get food entries for a specific date
 * @param {Date|string} date - The date to get entries for
 * @returns {Promise<Array>} - Array of food entries
 */
export const getFoodEntriesByDate = async (date) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to get food entries');
    }
    
    // Format the date to ISO string (YYYY-MM-DD)
    const dateString = date instanceof Date 
      ? toISODateString(date) 
      : toISODateString(new Date(date));
    
    // Create start and end timestamps for the day
    const startDate = new Date(dateString);
    const endDate = new Date(dateString);
    endDate.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Create query
    const entriesQuery = query(
      collection(db, FOOD_ENTRIES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date'),
      orderBy('meal'),
      orderBy('createdAt')
    );
    
    // Execute query
    const querySnapshot = await getDocs(entriesQuery);
    
    // Process results
    const entries = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to JS Date
        date: data.date.toDate(),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    return entries;
  } catch (error) {
    console.error('Error getting food entries:', error);
    return [];
  }
};

/**
 * Update a food entry in the user's diary
 * @param {string} entryId - The ID of the entry to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<void>}
 */
export const updateFoodEntry = async (entryId, updates) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to update food entries');
    }

    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    // Get the entry to verify ownership
    const entryRef = doc(db, FOOD_ENTRIES_COLLECTION, entryId);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Food entry not found');
    }
    
    const entryData = entrySnap.data();
    
    // Verify ownership
    if (entryData.userId !== auth.currentUser.uid) {
      throw new Error('You can only update your own food entries');
    }

    // Ensure numeric fields are numbers
    const numericFields = ['amount', 'calories', 'protein', 'carbs', 'fat'];
    const cleanedUpdates = { ...updates };
    
    numericFields.forEach(field => {
      if (cleanedUpdates[field] !== undefined) {
        cleanedUpdates[field] = Number(cleanedUpdates[field]) || 0;
      }
    });
    
    // Add updatedAt timestamp
    cleanedUpdates.updatedAt = serverTimestamp();

    // Update in Firestore
    await updateDoc(entryRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating food entry:', error);
    throw error;
  }
};

/**
 * Delete a food entry from the user's diary
 * @param {string} entryId - The ID of the entry to delete
 * @returns {Promise<void>}
 */
export const deleteFoodEntry = async (entryId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete food entries');
    }

    if (!entryId) {
      throw new Error('Entry ID is required');
    }
    
    // Get the entry to verify ownership
    const entryRef = doc(db, FOOD_ENTRIES_COLLECTION, entryId);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      throw new Error('Food entry not found');
    }
    
    const entryData = entrySnap.data();
    
    // Verify ownership
    if (entryData.userId !== auth.currentUser.uid) {
      throw new Error('You can only delete your own food entries');
    }

    // Delete from Firestore
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
};

/**
 * Get nutrition totals for a specific date
 * @param {Date|string} date - The date to get totals for
 * @returns {Promise<Object>} - Nutrition totals
 */
export const getNutritionTotals = async (date) => {
  try {
    const entries = await getFoodEntriesByDate(date);
    
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealTotals: {
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        snacks: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      }
    };
    
    // Calculate totals
    entries.forEach(entry => {
      totals.calories += entry.calories || 0;
      totals.protein += entry.protein || 0;
      totals.carbs += entry.carbs || 0;
      totals.fat += entry.fat || 0;
      
      // Add to meal totals if meal is valid
      if (entry.meal && totals.mealTotals[entry.meal]) {
        totals.mealTotals[entry.meal].calories += entry.calories || 0;
        totals.mealTotals[entry.meal].protein += entry.protein || 0;
        totals.mealTotals[entry.meal].carbs += entry.carbs || 0;
        totals.mealTotals[entry.meal].fat += entry.fat || 0;
      }
    });
    
    return totals;
  } catch (error) {
    console.error('Error calculating nutrition totals:', error);
    throw error;
  }
};

/**
 * Add a custom food to the user's personal database
 * @param {Object} foodData - The food data
 * @returns {Promise<Object>} - The added food
 */
export const addCustomFood = async (foodData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to add custom foods');
    }
    
    // Validate required fields
    if (!foodData.itemName) throw new Error('Food name is required');
    if (foodData.calories === undefined) throw new Error('Calories are required');
    
    // Prepare the food data
    const newFood = {
      ...foodData,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, USER_FOODS_COLLECTION), newFood);
    
    return {
      id: docRef.id,
      ...newFood,
      createdAt: new Date() // Convert server timestamp to Date for immediate use
    };
  } catch (error) {
    console.error('Error adding custom food:', error);
    throw error;
  }
};

/**
 * Get the user's custom foods
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} - Array of custom foods
 */
export const getCustomFoods = async (params = {}) => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get custom foods');
  }
  
  try {
    // Basic query that we always need - filter by user
    let baseQuery = query(
      collection(db, USER_FOODS_COLLECTION),
      where('userId', '==', auth.currentUser.uid)
    );
    
    // If we're filtering by recipe or not
    if (params.isRecipe !== undefined) {
      baseQuery = query(
        collection(db, USER_FOODS_COLLECTION),
        where('userId', '==', auth.currentUser.uid),
        where('isRecipe', '==', params.isRecipe)
      );
    }
    
    // If we're searching by name, we need a composite index
    if (params.name) {
      baseQuery = query(
        collection(db, USER_FOODS_COLLECTION),
        where('userId', '==', auth.currentUser.uid),
        where('itemName', '>=', params.name),
        where('itemName', '<=', params.name + '\uf8ff')
      );
    }
    
    // If we want to order by creation date (most recent first)
    if (params.sortByDate) {
      baseQuery = query(
        collection(db, USER_FOODS_COLLECTION),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    }
    
    // If we're filtering by recipe and sorting by date
    if (params.isRecipe !== undefined && params.sortByDate) {
      baseQuery = query(
        collection(db, USER_FOODS_COLLECTION),
        where('userId', '==', auth.currentUser.uid),
        where('isRecipe', '==', params.isRecipe),
        orderBy('createdAt', 'desc')
      );
    }
    
    // Execute the query
    const querySnapshot = await getDocs(baseQuery);
    
    // Process and return results
    const foods = [];
    querySnapshot.forEach((doc) => {
      foods.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      });
    });
    
    return foods;
  } catch (error) {
    console.error('Error getting custom foods:', error);
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
};

/**
 * Delete a custom food
 * @param {string} id - The ID of the custom food
 * @returns {Promise<void>}
 */
export const deleteCustomFood = async (id) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete custom foods');
    }
    
    // Get the food to verify ownership
    const foodRef = doc(db, USER_FOODS_COLLECTION, id);
    const foodSnap = await getDoc(foodRef);
    
    if (!foodSnap.exists()) {
      throw new Error('Custom food not found');
    }
    
    const foodData = foodSnap.data();
    
    // Verify ownership
    if (foodData.userId !== auth.currentUser.uid) {
      throw new Error('You can only delete your own custom foods');
    }
    
    // Delete from Firestore
    await deleteDoc(foodRef);
  } catch (error) {
    console.error('Error deleting custom food:', error);
    throw error;
  }
}; 
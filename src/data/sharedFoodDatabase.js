// sharedFoodDatabase.js
// This file contains functions to interact with shared food database in Firebase Firestore

import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

// Collection reference
const SHARED_FOODS_COLLECTION = 'sharedFoods';

/**
 * Get shared food items with filtering, sorting and pagination
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} - Array of food items
 */
export const getSharedFoods = async (params = {}) => {
  try {
    const { 
      query: searchQuery = '', 
      category = '', 
      sortBy = 'itemName', 
      sortDirection = 'asc',
      limit: resultLimit = 50
    } = params;
    
    // Create base query
    let queryRef = collection(db, SHARED_FOODS_COLLECTION);
    let constraints = [];
    
    // Add category filter if provided
    if (category) {
      constraints.push(where('category', '==', category));
    }
    
    // Add sorting
    const validSortFields = ['itemName', 'calories', 'usageCount', 'likes', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'itemName';
    constraints.push(orderBy(sortField, sortDirection));
    
    // Apply limit
    constraints.push(limit(parseInt(resultLimit) || 50));
    
    // Execute query
    const querySnapshot = await getDocs(query(queryRef, ...constraints));
    
    // Process results
    let results = [];
    querySnapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter by search query if provided (client-side filtering)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(food => 
        food.itemName.toLowerCase().includes(lowerQuery)
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error getting shared foods:', error);
    return [];
  }
};

/**
 * Get categories from shared foods
 * @returns {Promise<Array>} - Array of categories
 */
export const getSharedCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SHARED_FOODS_COLLECTION));
    const categories = new Set();
    
    querySnapshot.forEach(doc => {
      const food = doc.data();
      if (food.category) {
        categories.add(food.category);
      }
    });
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting shared categories:', error);
    return [];
  }
};

/**
 * Get a shared food item by ID
 * @param {string} id - The ID of the food item
 * @returns {Promise<Object>} - The food item
 */
export const getSharedFoodById = async (id) => {
  try {
    const docRef = doc(db, SHARED_FOODS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Food item not found');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error getting shared food by ID:', error);
    throw error;
  }
};

/**
 * Add a new shared food item
 * @param {Object} foodData - The food data
 * @returns {Promise<Object>} - The added food item
 */
export const addSharedFood = async (foodData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to add shared foods');
    }
    
    // Prepare the food data
    const newFood = {
      ...foodData,
      createdBy: auth.currentUser.uid,
      createdByName: auth.currentUser.displayName || 'Anonymous User',
      usageCount: 0,
      likes: 0,
      createdAt: serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, SHARED_FOODS_COLLECTION), newFood);
    
    return {
      id: docRef.id,
      ...newFood,
      createdAt: new Date() // Convert server timestamp to Date for immediate use
    };
  } catch (error) {
    console.error('Error adding shared food:', error);
    throw error;
  }
};

/**
 * Like a shared food item
 * @param {string} id - The ID of the food item
 * @returns {Promise<void>}
 */
export const likeSharedFood = async (id) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to like foods');
    }
    
    const docRef = doc(db, SHARED_FOODS_COLLECTION, id);
    await updateDoc(docRef, {
      likes: increment(1)
    });
  } catch (error) {
    console.error('Error liking shared food:', error);
    throw error;
  }
};

/**
 * Increment usage count for a shared food item
 * @param {string} id - The ID of the food item
 * @returns {Promise<void>}
 */
export const incrementUsageCount = async (id) => {
  try {
    const docRef = doc(db, SHARED_FOODS_COLLECTION, id);
    await updateDoc(docRef, {
      usageCount: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    throw error;
  }
};

/**
 * Delete a shared food item
 * @param {string} id - The ID of the food item
 * @returns {Promise<void>}
 */
export const deleteSharedFood = async (id) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete foods');
    }
    
    // Get the food to check ownership
    const food = await getSharedFoodById(id);
    
    // Only allow deletion by the creator
    if (food.createdBy !== auth.currentUser.uid) {
      throw new Error('You can only delete foods you created');
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, SHARED_FOODS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting shared food:', error);
    throw error;
  }
};

/**
 * Update a shared food item
 * @param {string} id - The ID of the food item
 * @param {Object} foodData - The updated food data
 * @returns {Promise<Object>} - The updated food item
 */
export const updateSharedFood = async (id, foodData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to update foods');
    }
    
    // Get the food to check ownership
    const food = await getSharedFoodById(id);
    
    // Only allow updates by the creator
    if (food.createdBy !== auth.currentUser.uid) {
      throw new Error('You can only update foods you created');
    }
    
    // Remove fields that shouldn't be updated
    const { createdBy, createdAt, likes, usageCount, ...updatableData } = foodData;
    
    // Add updatedAt timestamp
    const updates = {
      ...updatableData,
      updatedAt: serverTimestamp()
    };
    
    // Update in Firestore
    const docRef = doc(db, SHARED_FOODS_COLLECTION, id);
    await updateDoc(docRef, updates);
    
    // Return updated food
    return {
      id,
      ...food,
      ...updates,
      updatedAt: new Date() // Convert server timestamp to Date for immediate use
    };
  } catch (error) {
    console.error('Error updating shared food:', error);
    throw error;
  }
}; 
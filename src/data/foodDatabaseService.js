// foodDatabaseService.js
// This file provides a unified interface to access all food databases

import australianFoodDatabase, { 
  getCategories as getAustralianCategories,
  getStores as getAustralianStores,
  searchFoods as searchAustralianFoods
} from './australianFoodDatabase';

import usFoodDatabase, {
  getCategories as getUSCategories,
  getStores as getUSStores,
  searchFoods as searchUSFoods
} from './usFoodDatabase';

import {
  getSharedFoods,
  getSharedCategories,
  addSharedFood,
  likeSharedFood,
  incrementUsageCount,
  deleteSharedFood,
  getSharedFoodById,
  updateSharedFood
} from './sharedFoodDatabase';

import {
  addFoodToDiary,
  getFoodEntriesByDate,
  updateFoodEntry,
  deleteFoodEntry,
  getNutritionTotals,
  addCustomFood,
  getCustomFoods,
  deleteCustomFood
} from './userFoodDatabase';

// Database source identifiers
export const DATABASE_SOURCES = {
  AUSTRALIAN: 'australian',
  US: 'us',
  SHARED: 'shared',
  USER: 'user',
  ALL: 'all'
};

/**
 * Get all categories from all databases
 * @param {string} source - The database source to get categories from
 * @returns {Promise<Array>} - Array of unique categories
 */
export const getAllCategories = async (source = DATABASE_SOURCES.ALL) => {
  try {
    const categories = new Set();
    const errors = [];
    
    // Get categories from Australian database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.AUSTRALIAN) {
      try {
        getAustralianCategories().forEach(category => categories.add(category));
      } catch (error) {
        console.error('Error getting Australian categories:', error);
        errors.push({ source: DATABASE_SOURCES.AUSTRALIAN, error });
      }
    }
    
    // Get categories from US database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.US) {
      try {
        getUSCategories().forEach(category => categories.add(category));
      } catch (error) {
        console.error('Error getting US categories:', error);
        errors.push({ source: DATABASE_SOURCES.US, error });
      }
    }
    
    // Get categories from shared database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.SHARED) {
      try {
        const sharedCategories = await getSharedCategories();
        sharedCategories.forEach(category => categories.add(category));
      } catch (error) {
        console.error('Error getting shared categories:', error);
        errors.push({ source: DATABASE_SOURCES.SHARED, error });
      }
    }
    
    // Get categories from user database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.USER) {
      try {
        const userFoods = await getCustomFoods();
        userFoods.forEach(food => {
          if (food.category) {
            categories.add(food.category);
          }
        });
      } catch (error) {
        console.error('Error getting user categories:', error);
        errors.push({ source: DATABASE_SOURCES.USER, error });
      }
    }
    
    // If all sources failed, throw an error
    if (errors.length > 0 && errors.length === Object.keys(DATABASE_SOURCES).length - 1) {
      throw new Error('Failed to get categories from all sources');
    }
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting all categories:', error);
    throw error;
  }
};

/**
 * Get all stores from all databases
 * @param {string} source - The database source to get stores from
 * @returns {Promise<Array>} - Array of unique stores
 */
export const getAllStores = async (source = DATABASE_SOURCES.ALL) => {
  try {
    const stores = new Set();
    const errors = [];
    
    // Get stores from Australian database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.AUSTRALIAN) {
      try {
        getAustralianStores().forEach(store => stores.add(store));
      } catch (error) {
        console.error('Error getting Australian stores:', error);
        errors.push({ source: DATABASE_SOURCES.AUSTRALIAN, error });
      }
    }
    
    // Get stores from US database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.US) {
      try {
        getUSStores().forEach(store => stores.add(store));
      } catch (error) {
        console.error('Error getting US stores:', error);
        errors.push({ source: DATABASE_SOURCES.US, error });
      }
    }
    
    // If all sources failed, throw an error
    if (errors.length > 0 && errors.length === 2) { // Only 2 sources have stores
      throw new Error('Failed to get stores from all sources');
    }
    
    return Array.from(stores).sort();
  } catch (error) {
    console.error('Error getting all stores:', error);
    throw error;
  }
};

/**
 * Search for food items across all databases
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} - Array of food items
 */
export const searchAllFoods = async (params = {}) => {
  try {
    const { 
      query = '', 
      category = '', 
      store = '', 
      source = DATABASE_SOURCES.ALL,
      sortBy = 'name',
      sortDirection = 'asc',
      limit = 50
    } = params;
    
    let results = [];
    const errors = [];
    
    // Search Australian database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.AUSTRALIAN) {
      try {
        const australianResults = searchAustralianFoods({ query, category, store });
        results = [...results, ...australianResults.map(item => ({
          ...item,
          source: DATABASE_SOURCES.AUSTRALIAN
        }))];
      } catch (error) {
        console.error('Error searching Australian foods:', error);
        errors.push({ source: DATABASE_SOURCES.AUSTRALIAN, error });
      }
    }
    
    // Search US database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.US) {
      try {
        const usResults = searchUSFoods({ query, category, store });
        results = [...results, ...usResults.map(item => ({
          ...item,
          source: DATABASE_SOURCES.US
        }))];
      } catch (error) {
        console.error('Error searching US foods:', error);
        errors.push({ source: DATABASE_SOURCES.US, error });
      }
    }
    
    // Search shared database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.SHARED) {
      try {
        const sharedParams = { 
          query, 
          category, 
          sortBy: sortBy === 'name' ? 'itemName' : sortBy,
          sortDirection,
          limit: parseInt(limit) || 50
        };
        
        const sharedResults = await getSharedFoods(sharedParams);
        results = [...results, ...sharedResults.map(item => ({
          ...item,
          source: DATABASE_SOURCES.SHARED
        }))];
      } catch (error) {
        console.error('Error searching shared foods:', error);
        errors.push({ source: DATABASE_SOURCES.SHARED, error });
      }
    }
    
    // Search user database
    if (source === DATABASE_SOURCES.ALL || source === DATABASE_SOURCES.USER) {
      try {
        const userParams = { 
          query, 
          category, 
          sortBy: sortBy === 'name' ? 'itemName' : sortBy,
          sortDirection
        };
        
        const userResults = await getCustomFoods(userParams);
        results = [...results, ...userResults.map(item => ({
          ...item,
          source: DATABASE_SOURCES.USER
        }))];
      } catch (error) {
        console.error('Error searching user foods:', error);
        errors.push({ source: DATABASE_SOURCES.USER, error });
      }
    }
    
    // If all sources failed, throw an error
    if (errors.length > 0 && errors.length === Object.keys(DATABASE_SOURCES).length - 1) {
      throw new Error('Failed to search foods from all sources');
    }
    
    // Sort results
    try {
      if (sortBy === 'name') {
        results.sort((a, b) => {
          const nameA = (a.itemName || '').toLowerCase();
          const nameB = (b.itemName || '').toLowerCase();
          return sortDirection === 'asc' 
            ? nameA.localeCompare(nameB) 
            : nameB.localeCompare(nameA);
        });
      } else if (sortBy === 'calories') {
        results.sort((a, b) => {
          const caloriesA = parseFloat(a.calories) || 0;
          const caloriesB = parseFloat(b.calories) || 0;
          return sortDirection === 'asc' 
            ? caloriesA - caloriesB 
            : caloriesB - caloriesA;
        });
      } else if (sortBy === 'usageCount') {
        results.sort((a, b) => {
          const usageA = parseInt(a.usageCount) || 0;
          const usageB = parseInt(b.usageCount) || 0;
          return sortDirection === 'asc' 
            ? usageA - usageB 
            : usageB - usageA;
        });
      } else if (sortBy === 'likes') {
        results.sort((a, b) => {
          const likesA = parseInt(a.likes) || 0;
          const likesB = parseInt(b.likes) || 0;
          return sortDirection === 'asc' 
            ? likesA - likesB 
            : likesB - likesA;
        });
      }
    } catch (error) {
      console.error('Error sorting results:', error);
      // Continue with unsorted results if sorting fails
    }
    
    // Apply limit
    const limitNum = parseInt(limit) || 50;
    return results.slice(0, limitNum);
  } catch (error) {
    console.error('Error searching all foods:', error);
    throw error;
  }
};

/**
 * Get a food item by ID from any database
 * @param {string} id - The ID of the food item
 * @param {string} source - The database source
 * @returns {Promise<Object>} - The food item
 */
export const getFoodById = async (id, source) => {
  try {
    if (!id) {
      throw new Error('Food ID is required');
    }
    
    if (!source) {
      throw new Error('Database source is required');
    }
    
    if (source === DATABASE_SOURCES.AUSTRALIAN) {
      const food = australianFoodDatabase.find(item => item.id === id);
      if (!food) {
        throw new Error('Food item not found in Australian database');
      }
      return { ...food, source: DATABASE_SOURCES.AUSTRALIAN };
    } else if (source === DATABASE_SOURCES.US) {
      const food = usFoodDatabase.find(item => item.id === id);
      if (!food) {
        throw new Error('Food item not found in US database');
      }
      return { ...food, source: DATABASE_SOURCES.US };
    } else if (source === DATABASE_SOURCES.SHARED) {
      const food = await getSharedFoodById(id);
      return { ...food, source: DATABASE_SOURCES.SHARED };
    } else if (source === DATABASE_SOURCES.USER) {
      // This would need to be implemented in userFoodDatabase.js
      throw new Error('Getting user food by ID is not implemented yet');
    } else {
      throw new Error(`Unknown database source: ${source}`);
    }
  } catch (error) {
    console.error('Error getting food by ID:', error);
    throw error;
  }
};

/**
 * Add a food item to the user's diary
 * @param {string} id - The ID of the food item
 * @param {string} source - The database source
 * @param {Object} options - Additional options (meal, date, amount)
 * @returns {Promise<string>} - The ID of the new diary entry
 */
export const addFoodItemToDiary = async (id, source, options = {}) => {
  try {
    if (!id) {
      throw new Error('Food ID is required');
    }
    
    if (!source) {
      throw new Error('Database source is required');
    }
    
    // Get the food item
    const food = await getFoodById(id, source);
    
    // Calculate nutrition based on amount
    const amount = options.amount || 1;
    const multiplier = amount / 100; // Assuming standard serving is 100g
    
    // Prepare the entry
    const entry = {
      foodId: id,
      name: food.itemName,
      date: options.date || new Date(),
      meal: options.meal || 'snacks',
      amount,
      calories: Math.round(food.calories * multiplier),
      protein: parseFloat((food.protein * multiplier).toFixed(1)),
      carbs: parseFloat((food.carbs * multiplier).toFixed(1)),
      fat: parseFloat((food.fat * multiplier).toFixed(1)),
      source
    };
    
    // Add to diary
    const entryId = await addFoodToDiary(entry);
    
    // Increment usage count for shared foods
    if (source === DATABASE_SOURCES.SHARED) {
      try {
        await incrementUsageCount(id);
      } catch (error) {
        console.error('Error incrementing usage count:', error);
        // Continue even if this fails
      }
    }
    
    return entryId;
  } catch (error) {
    console.error('Error adding food to diary:', error);
    throw error;
  }
};

// Export all functions from userFoodDatabase
export {
  addFoodToDiary,
  getFoodEntriesByDate,
  updateFoodEntry,
  deleteFoodEntry,
  getNutritionTotals,
  addCustomFood,
  getCustomFoods,
  deleteCustomFood
};

// Export all functions from sharedFoodDatabase
export {
  addSharedFood,
  likeSharedFood,
  incrementUsageCount,
  deleteSharedFood,
  updateSharedFood
}; 
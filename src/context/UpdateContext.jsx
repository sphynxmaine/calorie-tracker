import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Create context
const UpdateContext = createContext();

// Custom hook to use the update context
export const useUpdate = () => useContext(UpdateContext);

export const UpdateProvider = ({ children }) => {
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process pending updates when back online
  useEffect(() => {
    if (isOnline && pendingUpdates.length > 0) {
      processPendingUpdates();
    }
  }, [isOnline, pendingUpdates]);

  // Add a notification
  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
      duration
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Add an operation to pending updates
  const addPendingUpdate = (operation, data, onSuccess, onError) => {
    const updateId = Date.now();
    const update = {
      id: updateId,
      operation,
      data,
      onSuccess,
      onError,
      retries: 0,
      maxRetries: 3
    };

    setPendingUpdates(prev => [...prev, update]);

    // If online, process immediately
    if (isOnline) {
      processUpdate(update);
    } else {
      // Notify user that update will be processed when online
      addNotification('You are offline. Changes will be saved when you reconnect.', 'warning', 5000);
    }

    return updateId;
  };

  // Helper function to get user collection reference
  const getUserRef = () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return doc(db, 'users', user.uid);
  };

  // Process a single update
  const processUpdate = async (update) => {
    try {
      let result;
      
      // Execute the operation based on type
      switch (update.operation) {
        case 'ADD_FOOD': {
          const userRef = getUserRef();
          const foodCollectionRef = collection(userRef, 'foods');
          
          // Validate food data
          if (!update.data.name) throw new Error('Food name is required');
          
          const foodData = {
            ...update.data,
            calories: Number(update.data.calories) || 0,
            protein: Number(update.data.protein) || 0,
            carbs: Number(update.data.carbs) || 0,
            fat: Number(update.data.fat) || 0,
            dateAdded: serverTimestamp()
          };
          
          // Add food to user's collection
          const docRef = await addDoc(foodCollectionRef, foodData);
          
          result = { 
            success: true, 
            message: 'Food added successfully!',
            id: docRef.id,
            data: foodData
          };
          break;
        }
        
        case 'UPDATE_FOOD': {
          const userRef = getUserRef();
          const { id, ...foodData } = update.data;
          
          if (!id) throw new Error('Food ID is required for updates');
          
          const foodRef = doc(userRef, 'foods', id);
          
          // Check if food exists
          const foodDoc = await getDoc(foodRef);
          if (!foodDoc.exists()) {
            throw new Error('Food not found');
          }
          
          // Prepare update data
          const updateData = {
            ...foodData,
            calories: Number(foodData.calories) || 0,
            protein: Number(foodData.protein) || 0,
            carbs: Number(foodData.carbs) || 0,
            fat: Number(foodData.fat) || 0,
            lastUpdated: serverTimestamp()
          };
          
          // Update food
          await updateDoc(foodRef, updateData);
          
          result = { 
            success: true, 
            message: 'Food updated successfully!',
            id,
            data: updateData
          };
          break;
        }
        
        case 'DELETE_FOOD': {
          const userRef = getUserRef();
          const foodId = update.data.id;
          
          if (!foodId) throw new Error('Food ID is required');
          
          const foodRef = doc(userRef, 'foods', foodId);
          
          // Check if food exists
          const foodDoc = await getDoc(foodRef);
          if (!foodDoc.exists()) {
            throw new Error('Food not found');
          }
          
          // Delete food
          await deleteDoc(foodRef);
          
          result = { 
            success: true, 
            message: 'Food deleted successfully!',
            id: foodId
          };
          break;
        }
        
        case 'ADD_TO_DIARY': {
          const userRef = getUserRef();
          const diaryEntryRef = collection(userRef, 'diaryEntries');
          
          const { food, date, meal } = update.data;
          if (!food || !date || !meal) {
            throw new Error('Food, date, and meal are required');
          }
          
          // Handle food name - check both name and itemName properties
          const foodName = food.name || food.itemName;
          if (!foodName) {
            throw new Error('Food name is required');
          }
          
          const diaryData = {
            foodId: food.id,
            foodName: foodName,
            calories: Number(food.calories) || 0,
            protein: Number(food.protein) || 0,
            carbs: Number(food.carbs) || 0,
            fat: Number(food.fat) || 0,
            date,
            meal,
            servingSize: update.data.servingSize || 1,
            dateAdded: serverTimestamp()
          };
          
          // Add entry to diary
          const docRef = await addDoc(diaryEntryRef, diaryData);
          
          result = { 
            success: true, 
            message: 'Added to food diary!',
            id: docRef.id,
            data: diaryData
          };
          break;
        }
        
        case 'REMOVE_FROM_DIARY': {
          const userRef = getUserRef();
          const entryId = update.data.id;
          
          if (!entryId) throw new Error('Diary entry ID is required');
          
          const entryRef = doc(userRef, 'diaryEntries', entryId);
          
          // Check if entry exists
          const entryDoc = await getDoc(entryRef);
          if (!entryDoc.exists()) {
            throw new Error('Diary entry not found');
          }
          
          // Delete entry
          await deleteDoc(entryRef);
          
          result = { 
            success: true, 
            message: 'Removed from food diary!',
            id: entryId
          };
          break;
        }
        
        case 'UPDATE_USER_PROFILE': {
          const userRef = getUserRef();
          const profileData = update.data;
          
          // Update user profile
          await updateDoc(userRef, {
            ...profileData,
            lastUpdated: serverTimestamp()
          });
          
          result = { 
            success: true, 
            message: 'Profile updated successfully!',
            data: profileData
          };
          break;
        }
        
        // Add other operation types as needed
        default:
          throw new Error(`Unknown operation: ${update.operation}`);
      }

      // Handle success
      if (result.success) {
        // Call onSuccess callback if provided
        if (update.onSuccess) {
          update.onSuccess(result);
        }

        // Show success notification
        addNotification(result.message, 'success');

        // Remove from pending updates
        setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error processing update:', error);
      
      // Increment retry count
      const updatedUpdate = {
        ...update,
        retries: update.retries + 1
      };

      // Check if max retries reached
      if (updatedUpdate.retries >= updatedUpdate.maxRetries) {
        // Call onError callback if provided
        if (update.onError) {
          update.onError(error);
        }

        // Show error notification
        addNotification(`Error: ${error.message}. Changes could not be saved.`, 'error', 5000);

        // Remove from pending updates
        setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      } else {
        // Update the retry count and keep in pending updates
        setPendingUpdates(prev => 
          prev.map(u => u.id === update.id ? updatedUpdate : u)
        );

        // Retry after a delay (exponential backoff)
        const retryDelay = Math.pow(2, updatedUpdate.retries) * 1000;
        setTimeout(() => {
          processUpdate(updatedUpdate);
        }, retryDelay);
      }
    }
  };

  // Process all pending updates
  const processPendingUpdates = () => {
    pendingUpdates.forEach(update => {
      processUpdate(update);
    });
  };

  // Memoize the value object to prevent unnecessary re-renders
  const value = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    isOnline,
    addPendingUpdate,
    pendingUpdates,
    processPendingUpdates
  }), [notifications, pendingUpdates, isOnline]);

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
};

export default UpdateContext; 
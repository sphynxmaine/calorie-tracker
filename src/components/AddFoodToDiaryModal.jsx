import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db, standardizeFoodItem, prepareFoodEntry, getFoodDisplayName } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import SearchFoodItem from './SearchFoodItem';
import { LoadingButton } from './LoadingState';

const AddFoodToDiaryModal = ({ isOpen, onClose, mealType, onFoodAdded, date }) => {
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const modalRef = useRef();
  const searchInputRef = useRef();
  
  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle search term changes with debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      searchFoods(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedFood(null);
      setQuantity(1);
      setError('');
    }
  }, [isOpen]);
  
  const searchFoods = async (term) => {
    if (term.length < 2) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const results = [];
      const searchTermLower = term.toLowerCase();
      
      // Search user's own foods first
      const userFoodsQuery = query(
        collection(db, 'foods'),
        where('userId', '==', currentUser.uid),
        orderBy('name'),
        limit(10)
      );
      
      const userFoodsSnapshot = await getDocs(userFoodsQuery);
      userFoodsSnapshot.forEach(doc => {
        const food = { id: doc.id, ...doc.data(), source: 'user' };
        if (getFoodDisplayName(food).toLowerCase().includes(searchTermLower)) {
          results.push(standardizeFoodItem(food));
        }
      });
      
      // Then search shared foods
      const sharedFoodsQuery = query(
        collection(db, 'foods'),
        where('isShared', '==', true),
        orderBy('name'),
        limit(20)
      );
      
      const sharedFoodsSnapshot = await getDocs(sharedFoodsQuery);
      sharedFoodsSnapshot.forEach(doc => {
        const food = { id: doc.id, ...doc.data(), source: 'shared' };
        if (getFoodDisplayName(food).toLowerCase().includes(searchTermLower)) {
          results.push(standardizeFoodItem(food));
        }
      });
      
      // Also search the user's recent entries
      const recentEntriesQuery = query(
        collection(db, 'foodEntries'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const recentEntriesSnapshot = await getDocs(recentEntriesQuery);
      const processedFoodIds = new Set();
      
      recentEntriesSnapshot.forEach(doc => {
        const entry = doc.data();
        if (entry.food && !processedFoodIds.has(entry.food.id)) {
          const food = { ...entry.food, source: 'recent' };
          if (getFoodDisplayName(food).toLowerCase().includes(searchTermLower)) {
            processedFoodIds.add(entry.food.id);
            results.push(standardizeFoodItem(food));
          }
        }
      });
      
      // Filter and sort results
      const filteredResults = results
        .filter(food => getFoodDisplayName(food).toLowerCase().includes(searchTermLower))
        .sort((a, b) => {
          // Sort by source (user, recent, shared)
          const sourceOrder = { user: 0, recent: 1, shared: 2 };
          return sourceOrder[a.source] - sourceOrder[b.source];
        });
      
      setSearchResults(filteredResults.slice(0, 20));
    } catch (error) {
      console.error('Error searching foods:', error);
      setError('Failed to search foods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setQuantity(1);
  };
  
  const handleQuantityChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddFood = async () => {
    if (!selectedFood) {
      setError('Please select a food item first');
      return;
    }
    
    try {
      setIsAdding(true);
      setError('');
      
      // Calculate nutrition based on quantity
      const food = {
        ...selectedFood,
        calories: Math.round(selectedFood.calories * quantity),
        protein: Math.round(selectedFood.protein * quantity * 10) / 10,
        carbs: Math.round(selectedFood.carbs * quantity * 10) / 10,
        fat: Math.round(selectedFood.fat * quantity * 10) / 10,
        quantity: quantity
      };
      
      // Prepare entry for saving
      const foodEntry = prepareFoodEntry({
        food,
        userId: currentUser.uid,
        mealType,
        date: date || new Date()
      });
      
      // Add to Firestore
      await addDoc(collection(db, 'foodEntries'), foodEntry);
      
      // Close modal and refresh data
      onClose();
      if (onFoodAdded) {
        onFoodAdded();
      }
    } catch (error) {
      console.error('Error adding food:', error);
      setError('Failed to add food. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDarkMode ? 'bg-black bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}>
      <div 
        ref={modalRef}
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Add Food to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {/* Search input */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium mb-1">
              Search for food
            </label>
            <input
              ref={searchInputRef}
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type at least 2 characters to search..."
              className={`w-full p-2 rounded border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 bg-red-500 bg-opacity-25 text-red-500 rounded">
              {error}
            </div>
          )}
          
          {/* Search results */}
          {!isLoading && searchResults.length > 0 && !selectedFood && (
            <div className="mb-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((food) => (
                  <SearchFoodItem
                    key={`${food.id}-${food.source}`}
                    food={food}
                    onClick={() => handleFoodSelect(food)}
                    isSelected={false}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Selected food details */}
          {selectedFood && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Selected Food</h3>
              <SearchFoodItem
                food={selectedFood}
                onClick={() => {}}
                isSelected={true}
                isDarkMode={isDarkMode}
              />
              
              <div className="mt-4">
                <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                  Quantity (servings)
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className={`w-full p-2 rounded border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Nutrition (for {quantity} servings)</h4>
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-xs opacity-75">Calories</p>
                      <p className="font-semibold">{Math.round(selectedFood.calories * quantity)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Protein</p>
                      <p className="font-semibold">{Math.round(selectedFood.protein * quantity * 10) / 10}g</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Carbs</p>
                      <p className="font-semibold">{Math.round(selectedFood.carbs * quantity * 10) / 10}g</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75">Fat</p>
                      <p className="font-semibold">{Math.round(selectedFood.fat * quantity * 10) / 10}g</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-end">
            <LoadingButton
              isLoading={isAdding}
              onClick={handleAddFood}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Food
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};

AddFoodToDiaryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mealType: PropTypes.string.isRequired,
  onFoodAdded: PropTypes.func,
  date: PropTypes.instanceOf(Date),
};

export default AddFoodToDiaryModal;
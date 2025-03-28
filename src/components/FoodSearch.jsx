import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db, standardizeFoodData, fetchFoods } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import australianFoodData from '../data/australianFoodDatabase';
import FoodContributionForm from './FoodContributionForm';
import AddFoodToDiaryModal from './AddFoodToDiaryModal';
import { debounce } from '../utils/helpers';

// Create a cache for food search results to improve performance
const foodSearchCache = {};

const FoodSearch = ({ onSelectFood, initialMeal = 'breakfast' }) => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);

  // Fetch recent foods on component mount
  useEffect(() => {
    fetchRecentFoods();
  }, []);

  // Fetch recent foods the user has added to their diary
  const fetchRecentFoods = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Get the 10 most recent food entries
      const recentFoodsQuery = query(
        collection(db, "foodEntries"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const snapshot = await getDocs(recentFoodsQuery);
      
      // Create a map to deduplicate foods by name
      const foodsMap = new Map();
      
      snapshot.forEach(doc => {
        const food = standardizeFoodData(doc.data());
        // Use foodName as key to avoid duplicates
        if (!foodsMap.has(food.foodName)) {
          foodsMap.set(food.foodName, food);
        }
      });
      
      // Convert map to array and limit to 5 items
      const recentFoodsList = Array.from(foodsMap.values()).slice(0, 5);
      setRecentFoods(recentFoodsList);
    } catch (error) {
      console.error("Error fetching recent foods:", error);
    }
  };

  // Create a debounced search function for better performance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (term.length < 2) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      
      fetchFoodsForSearch(term);
    }, 300),
    []
  );

  // Effect for search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setIsLoading(true);
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, debouncedSearch]);

  // Function to search foods
  const fetchFoodsForSearch = async (term) => {
    try {
      setIsLoading(true);
      
      // Check cache first
      const cacheKey = `search_${term.toLowerCase()}`;
      if (foodSearchCache[cacheKey] && foodSearchCache[cacheKey].timestamp > Date.now() - 300000) {
        setSearchResults(foodSearchCache[cacheKey].data);
        setIsLoading(false);
        return;
      }
      
      // Search Australian food database
      const searchTermLower = term.toLowerCase();
      const results = [];
      
      // Add foods from the Australian database that match
      const ausResults = Object.values(australianFoodData)
        .filter(food => 
          food.name.toLowerCase().includes(searchTermLower) || 
          (food.brand && food.brand.toLowerCase().includes(searchTermLower))
        )
        .slice(0, 20) // Limit to 20 results
        .map(food => standardizeFoodData({
          ...food,
          id: food.id || `aus-${Math.random().toString(36).substr(2, 9)}`,
          source: 'australian',
          country: 'australia'
        }));
      
      results.push(...ausResults);
      
      // Get user foods from Firebase using the standardized fetchFoods function
      const userFoods = await fetchFoods(term, 20);
      results.push(...userFoods);
      
      // Sort results by relevance
      const sortedResults = results
        .filter(food => food !== null) // Filter out null values
        .sort((a, b) => {
          // Exact matches first
          const aExact = a.name.toLowerCase() === searchTermLower;
          const bExact = b.name.toLowerCase() === searchTermLower;
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Then starts with search term
          const aStartsWith = a.name.toLowerCase().startsWith(searchTermLower);
          const bStartsWith = b.name.toLowerCase().startsWith(searchTermLower);
          
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          // Then alphabetical
          return a.name.localeCompare(b.name);
        });
      
      // Limit to 30 results total to avoid overwhelming the UI
      const limitedResults = sortedResults.slice(0, 30);
      
      // Cache the results
      foodSearchCache[cacheKey] = {
        timestamp: Date.now(),
        data: limitedResults
      };
      
      setSearchResults(limitedResults);
      setIsLoading(false);
    } catch (error) {
      console.error("Error searching foods:", error);
      setIsLoading(false);
    }
  };

  // Handle food selection
  const handleSelectFood = (food) => {
    setSelectedFood(standardizeFoodData(food));
    setIsModalOpen(true);
  };

  // Handle adding a new food
  const handleAddFood = (food) => {
    setIsAddingFood(false);
    setSelectedFood(standardizeFoodData(food));
    setIsModalOpen(true);
  };

  // Handle food saved to diary
  const handleFoodSaved = (savedFood) => {
    // Update recent foods
    fetchRecentFoods();
    
    // Call parent callback if provided
    if (onSelectFood) {
      onSelectFood(savedFood);
    }
    
    // Close the modal
    setIsModalOpen(false);
    setSelectedFood(null);
  };

  // Country badge component
  const CountryBadge = ({ country }) => {
    // Get country display data
    const getCountryDisplay = (countryCode) => {
      switch(countryCode) {
        case 'australia': return { name: 'AUS', color: 'bg-green-100 text-green-800' };
        case 'unitedStates': return { name: 'USA', color: 'bg-blue-100 text-blue-800' };
        case 'unitedKingdom': return { name: 'UK', color: 'bg-red-100 text-red-800' };
        case 'canada': return { name: 'CAN', color: 'bg-red-100 text-red-800' };
        case 'newZealand': return { name: 'NZ', color: 'bg-black text-white' };
        case 'personal': return { name: 'MY', color: 'bg-purple-100 text-purple-800' };
        default: return { name: 'OTHER', color: 'bg-gray-100 text-gray-800' };
      }
    };
    
    const display = getCountryDisplay(country);
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : display.color}`}>
        {display.name}
      </span>
    );
  };

  // Food item display component
  const FoodItem = ({ food, onSelect, isRecent = false }) => {
    return (
      <div 
        className={`flex items-center p-3 cursor-pointer ${
          isDarkMode 
            ? 'hover:bg-gray-700 border-b border-gray-700' 
            : 'hover:bg-gray-100 border-b border-gray-200'
        }`}
        onClick={() => onSelect(food)}
      >
        <div className="flex-1">
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {food.displayName} {food.brand && <span className="text-gray-500">({food.brand})</span>}
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {food.servingSize || 100}{food.servingUnit || 'g'} · {food.calories || 0} cal
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isRecent && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
            }`}>
              Recent
            </span>
          )}
          {food.source === 'custom' && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
            }`}>
              Custom
            </span>
          )}
          {food.source === 'community' && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              Community
            </span>
          )}
          <CountryBadge country={food.country} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isAddingFood ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Food
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add details for a food that doesn't exist in our database.
            </p>
          </div>
          <FoodContributionForm 
            onSave={handleAddFood}
            onCancel={() => setIsAddingFood(false)}
          />
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-3 pl-10 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Search for a food..."
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Recent Foods Section */}
          {searchTerm.length < 2 && recentFoods.length > 0 && (
            <div className={`rounded-lg overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg mb-4`}>
              <div className={`p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recent Foods
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {recentFoods.map(food => (
                  <FoodItem 
                    key={`recent-${food.id}`} 
                    food={food} 
                    onSelect={handleSelectFood}
                    isRecent={true}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className={`max-h-96 overflow-y-auto rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              {searchResults.map(food => (
                <FoodItem 
                  key={food.id} 
                  food={food} 
                  onSelect={handleSelectFood}
                />
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className={`p-4 text-center rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                No foods found. Try a different search or 
                <button 
                  className="ml-1 text-blue-500 hover:underline"
                  onClick={() => setIsAddingFood(true)}
                >
                  add a new food
                </button>.
              </p>
            </div>
          ) : null}
          
          <div className="flex justify-end">
            <button
              className={`px-4 py-2 text-sm rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              onClick={() => setIsAddingFood(true)}
            >
              Contribute Food
            </button>
          </div>
        </>
      )}
      
      {isModalOpen && selectedFood && (
        <AddFoodToDiaryModal
          food={selectedFood}
          initialMeal={initialMeal}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFood(null);
          }}
          onSave={handleFoodSaved}
        />
      )}
    </div>
  );
};

export default FoodSearch; 
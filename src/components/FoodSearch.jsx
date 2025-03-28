import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import australianFoodData from '../data/australianFoodDatabase';
import FoodContributionForm from './FoodContributionForm';
import AddFoodToDiaryModal from './AddFoodToDiaryModal';

const FoodSearch = ({ onSelectFood, initialMeal = 'breakfast' }) => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);

  // Effect for search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchFoods(searchTerm, setSearchResults, setIsLoading);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  // Handle food selection
  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  // Country badge display component
  const CountryBadge = ({ country }) => {
    // Get country display name and color
    const getCountryDisplay = (country) => {
      switch(country) {
        case 'australia':
          return { name: 'AUS', color: 'bg-green-100 text-green-800' };
        case 'unitedStates':
          return { name: 'USA', color: 'bg-blue-100 text-blue-800' };
        case 'unitedKingdom':
          return { name: 'UK', color: 'bg-red-100 text-red-800' };
        case 'canada':
          return { name: 'CAN', color: 'bg-red-100 text-red-800' };
        case 'newZealand':
          return { name: 'NZ', color: 'bg-black text-white' };
        case 'personal':
          return { name: 'My Food', color: 'bg-purple-100 text-purple-800' };
        case 'other':
        default:
          return { name: 'OTHER', color: 'bg-gray-100 text-gray-800' };
      }
    };
    
    const countryDisplay = getCountryDisplay(country);
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${
        isDarkMode ? 'bg-gray-700 text-gray-300' : countryDisplay.color
      }`}>
        {countryDisplay.name}
      </span>
    );
  };

  // Food item display component
  const FoodItem = ({ food, onSelect }) => {
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
            {food.name} {food.brand && <span className="text-gray-500">({food.brand})</span>}
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {food.servingSize || 100}{food.servingUnit || 'g'} · {food.calories || 0} cal
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {food.source === 'custom' && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
            }`}>
              Custom
            </span>
          )}
          {food.source === 'user' && (
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

  // Search function that includes all foods
  const fetchFoods = async (searchTerm) => {
    try {
      setIsLoading(true);
      const results = [];
      
      // Skip search if term is too short
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      
      // Search term preparation
      const searchTermLower = searchTerm.toLowerCase();
      
      // Add foods from the Australian database that match
      const ausResults = Object.values(australianFoodData)
        .filter(food => 
          food.name.toLowerCase().includes(searchTermLower) || 
          (food.brand && food.brand.toLowerCase().includes(searchTermLower))
        )
        .slice(0, 30) // Limit to 30 results
        .map(food => ({
          ...food,
          id: food.id || `aus-${Math.random().toString(36).substr(2, 9)}`,
          source: 'australian',
          country: 'australia'
        }));
      
      results.push(...ausResults);
      
      // Search user-contributed foods in Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        // Get approved user foods (from all countries)
        const userFoodsQuery = query(
          collection(db, "userFoods"),
          where("approved", "==", true),
          limit(30)
        );
        
        const userFoodsSnapshot = await getDocs(userFoodsQuery);
        const userFoods = userFoodsSnapshot.docs
          .filter(doc => {
            const food = doc.data();
            return food.name.toLowerCase().includes(searchTermLower) ||
                  (food.brand && food.brand.toLowerCase().includes(searchTermLower));
          })
          .map(doc => ({
            ...doc.data(),
            id: doc.id,
            source: 'user',
            country: doc.data().country || 'other'
          }));
        
        // Add user's own custom foods
        const customFoodsQuery = query(
          collection(db, "customFoods"),
          where("userId", "==", userId),
          limit(30)
        );
        
        const customFoodsSnapshot = await getDocs(customFoodsQuery);
        const customFoods = customFoodsSnapshot.docs
          .filter(doc => {
            const food = doc.data();
            return food.name.toLowerCase().includes(searchTermLower) ||
                  (food.brand && food.brand.toLowerCase().includes(searchTermLower));
          })
          .map(doc => ({
            ...doc.data(),
            id: doc.id,
            source: 'custom',
            country: 'personal'
          }));
        
        results.push(...userFoods, ...customFoods);
      }
      
      // Sort results by relevance
      const sortedResults = results.sort((a, b) => {
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
      
      setSearchResults(sortedResults.slice(0, 50)); // Limit to top 50 results
    } catch (error) {
      console.error("Error searching foods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new food
  const handleAddFood = (food) => {
    setIsAddingFood(false);
    setSelectedFood(food);
    setIsModalOpen(true);
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

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className={`max-h-96 overflow-y-auto rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              {searchResults.map(food => (
                <FoodItem key={food.id} food={food} onSelect={handleSelectFood} />
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
          onSave={(foodEntry) => {
            if (onSelectFood) {
              onSelectFood(foodEntry);
            }
            setIsModalOpen(false);
            setSelectedFood(null);
          }}
        />
      )}
    </div>
  );
};

export default FoodSearch; 
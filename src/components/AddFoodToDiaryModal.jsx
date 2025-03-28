import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import { db, auth, standardizeFoodData, addFoodToDiary } from '../firebase';
import PageHeader from './PageHeader';
import { formatDate, isToday } from '../utils/dateUtils';

const AddFoodToDiaryModal = ({ food, onClose, initialMeal = 'breakfast', isOpen }) => {
  const { isDarkMode } = useTheme();
  const [amount, setAmount] = useState(1);
  const [meal, setMeal] = useState(initialMeal || 'breakfast');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [success, setSuccess] = useState(false);
  
  // Standardize the food data on component mount to ensure consistency
  const [standardizedFood, setStandardizedFood] = useState(null);
  
  useEffect(() => {
    if (food) {
      setStandardizedFood(standardizeFoodData(food));
    }
  }, [food]);
  
  // Calculate nutrition based on amount
  const [calculatedNutrition, setCalculatedNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  // Available meal types
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
  
  // Calculate nutrition based on amount changes
  useEffect(() => {
    if (!standardizedFood) return;
    
    const baseCalories = standardizedFood.calories || 0;
    const baseProtein = standardizedFood.protein || 0;
    const baseCarbs = standardizedFood.carbs || 0;
    const baseFat = standardizedFood.fat || 0;
    
    setCalculatedNutrition({
      calories: Math.round(baseCalories * amount),
      protein: parseFloat((baseProtein * amount).toFixed(1)),
      carbs: parseFloat((baseCarbs * amount).toFixed(1)),
      fat: parseFloat((baseFat * amount).toFixed(1))
    });
  }, [amount, standardizedFood]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      if (!standardizedFood) {
        throw new Error("Food data is missing");
      }
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Use the new standardized function to add food to diary
      await addFoodToDiary(
        { ...standardizedFood, amount, servings: amount },
        meal,
        date,
        userId
      );
      
      // Show success message briefly
      setSuccess(true);
      
      // Wait for a moment before closing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error adding food to diary:", error);
      alert("Error adding food. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen || !food || !standardizedFood) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className={`w-full h-full max-w-md mx-auto rounded-t-xl ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <PageHeader 
          title="Add to Diary"
          showBackButton={true}
          onBackClick={onClose}
        />
        
        <div className="p-6">
          <div className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {standardizedFood.displayName}
          </div>

          {/* Nutrition Card */}
          <div className={`p-4 mb-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calculatedNutrition.calories}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  calories
                </div>
              </div>
              <div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {calculatedNutrition.protein}g
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  protein
                </div>
              </div>
              <div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {calculatedNutrition.carbs}g
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  carbs
                </div>
              </div>
              <div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {calculatedNutrition.fat}g
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  fat
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Amount (servings)
            </label>
            <div className="flex items-center">
              <button 
                onClick={() => setAmount(prev => Math.max(0.1, parseFloat((prev - 0.1).toFixed(1))))}
                className={`p-3 rounded-l-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                -
              </button>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className={`w-full p-3 text-center ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-gray-700' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border-y focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button 
                onClick={() => setAmount(prev => parseFloat((prev + 0.1).toFixed(1)))}
                className={`p-3 rounded-r-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                +
              </button>
            </div>
          </div>

          {/* Meal Type Selection */}
          <div className="mb-6">
            <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Meal
            </label>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setMeal(type)}
                  className={`p-3 rounded-lg transition-colors ${
                    meal === type
                      ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                      : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          <div className="mb-6">
            <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Date
            </label>
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
              className={`w-full p-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
              Food added successfully!
            </div>
          )}

          {/* Add to Diary Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 px-4 rounded-lg transition-all duration-200 btn-bounce ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-medium shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              'Add to Diary'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

AddFoodToDiaryModal.propTypes = {
  food: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  initialMeal: PropTypes.string,
  isOpen: PropTypes.bool
};

export default AddFoodToDiaryModal; 
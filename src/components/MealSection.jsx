import React from 'react';
import PropTypes from 'prop-types';
import { getFoodDisplayName } from '../firebase';

/**
 * Component for displaying a meal section with food entries
 */
const MealSection = ({ title, entries = [], onAddFood, refreshEntries, isDarkMode }) => {
  const mealType = title.toLowerCase();
  
  // Calculate total calories for this meal
  const totalCalories = entries.reduce((sum, entry) => {
    return sum + (entry.calories || entry.food?.calories || 0);
  }, 0);
  
  // Icons for each meal type
  const mealIcons = {
    breakfast: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    lunch: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    dinner: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      </svg>
    ),
    snacks: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };
  
  return (
    <div className={`mb-4 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      {/* Meal header with icon, title and total calories */}
      <div className="flex justify-between items-center p-4 border-b border-opacity-10">
        <div className="flex items-center">
          <span className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
            {mealIcons[mealType] || mealIcons.snacks}
          </span>
          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        </div>
        <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
          {Math.round(totalCalories)} cal
        </div>
      </div>
      
      {/* Food entries list */}
      <div className="divide-y divide-opacity-10">
        {entries && entries.length > 0 ? (
          entries.map((entry) => {
            // Ensure we have the proper values
            const foodName = getFoodDisplayName(entry.food || entry);
            const calories = Math.round(entry.calories || entry.food?.calories || 0);
            const protein = Math.round((entry.protein || entry.food?.protein || 0) * 10) / 10;
            const carbs = Math.round((entry.carbs || entry.food?.carbs || 0) * 10) / 10;
            const fat = Math.round((entry.fat || entry.food?.fat || 0) * 10) / 10;
            const quantity = entry.quantity || entry.food?.quantity || 1;
            
            return (
              <div 
                key={entry.id} 
                className={`flex justify-between items-center p-4 ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                } cursor-pointer transition-colors duration-200`}
                onClick={() => {
                  // Handle edit functionality here if needed
                  // This could dispatch an event or call a callback
                }}
              >
                <div className="flex-1">
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {foodName}
                    {quantity > 1 ? ` (${quantity})` : ''}
                  </div>
                  <div className="flex mt-1 text-xs space-x-2">
                    <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                      {protein}g P
                    </span>
                    <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-green-300' : 'bg-green-100 text-green-800'}`}>
                      {carbs}g C
                    </span>
                    <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                      {fat}g F
                    </span>
                  </div>
                </div>
                <div className={`ml-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calories} cal
                </div>
              </div>
            );
          })
        ) : (
          <div className={`p-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No food items
          </div>
        )}
        
        {/* Add food button */}
        <div className="p-2">
          <button
            onClick={() => onAddFood(mealType)}
            className={`w-full p-2 rounded-lg flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Food
          </button>
        </div>
      </div>
    </div>
  );
};

MealSection.propTypes = {
  title: PropTypes.string.isRequired,
  entries: PropTypes.array,
  onAddFood: PropTypes.func.isRequired,
  refreshEntries: PropTypes.func,
  isDarkMode: PropTypes.bool
};

export default MealSection; 
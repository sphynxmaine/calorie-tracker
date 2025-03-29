import React from 'react';
import PropTypes from 'prop-types';
import { getFoodDisplayName } from '../firebase';

/**
 * Component for displaying a food item in search results
 */
const SearchFoodItem = ({ food, onClick, isSelected, isDarkMode }) => {
  // Get the proper name for display
  const foodName = getFoodDisplayName(food);
  
  // Format nutritional values
  const calories = Math.round(food.calories || 0);
  const protein = Math.round((food.protein || 0) * 10) / 10;
  const carbs = Math.round((food.carbs || 0) * 10) / 10;
  const fat = Math.round((food.fat || 0) * 10) / 10;
  
  // Determine the source badge color
  const getBadgeColor = () => {
    if (isDarkMode) {
      switch (food.source) {
        case 'user':
          return 'bg-purple-900 text-purple-200';
        case 'recent':
          return 'bg-green-900 text-green-200';
        case 'shared':
          return 'bg-blue-900 text-blue-200';
        default:
          return 'bg-gray-700 text-gray-200';
      }
    } else {
      switch (food.source) {
        case 'user':
          return 'bg-purple-100 text-purple-800';
        case 'recent':
          return 'bg-green-100 text-green-800';
        case 'shared':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };
  
  // Get source label text
  const getSourceLabel = () => {
    switch (food.source) {
      case 'user':
        return 'My Food';
      case 'recent':
        return 'Recent';
      case 'shared':
        return 'Shared';
      default:
        return 'Food';
    }
  };
  
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? isDarkMode
            ? 'bg-blue-800 border-blue-600'
            : 'bg-blue-50 border-blue-300'
          : isDarkMode
            ? 'bg-gray-700 hover:bg-gray-600 border-transparent'
            : 'bg-white hover:bg-gray-50 border-transparent'
      } border`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-sm mb-1">
            {foodName}
          </div>
          <div className="flex space-x-2 text-xs">
            <div className={`inline-block px-2 py-1 rounded-full ${getBadgeColor()}`}>
              {getSourceLabel()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">
            {calories} cal
          </div>
          <div className="text-xs opacity-75">
            {protein}g P · {carbs}g C · {fat}g F
          </div>
        </div>
      </div>
    </div>
  );
};

SearchFoodItem.propTypes = {
  food: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  isDarkMode: PropTypes.bool
};

export default SearchFoodItem; 
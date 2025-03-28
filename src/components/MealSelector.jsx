import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';

const MealSelector = ({ selectedMeal, onSelectMeal }) => {
  const { isDarkMode } = useTheme();
  
  const mealOptions = [
    {
      id: 'breakfast',
      name: 'Breakfast',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'lunch',
      name: 'Lunch',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'dinner',
      name: 'Dinner',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      id: 'snack',
      name: 'Snack',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  ];
  
  return (
    <div className="mb-4">
      <label className={`block mb-2 font-medium ${
        isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
      }`}>
        Select Meal
      </label>
      <div className="grid grid-cols-4 gap-2">
        {mealOptions.map((meal) => (
          <button
            key={meal.id}
            type="button"
            onClick={() => onSelectMeal(meal.id)}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all ${
              selectedMeal === meal.id
                ? isDarkMode
                  ? 'bg-blue-900/30 border-blue-700 text-blue-400'
                  : 'bg-blue-50 border-blue-500 text-blue-700'
                : isDarkMode
                  ? 'bg-dark-bg-secondary border-dark-border text-dark-text-secondary hover:bg-dark-bg-hover'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {meal.icon}
            <span className="mt-1 text-sm font-medium">{meal.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

MealSelector.propTypes = {
  selectedMeal: PropTypes.oneOf(['breakfast', 'lunch', 'dinner', 'snack']).isRequired,
  onSelectMeal: PropTypes.func.isRequired
};

export default MealSelector; 
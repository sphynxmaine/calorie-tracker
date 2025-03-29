import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const DailyCalorieProgress = ({ consumed, target }) => {
  const { isDarkMode } = useTheme();
  
  // Calculate percentage of target calories consumed
  const percentage = Math.min(Math.round((consumed / target) * 100), 100);
  
  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentage < 80) return '#3B82F6'; // Blue
    if (percentage < 100) return '#10B981'; // Green
    return '#EF4444'; // Red (over target)
  };
  
  // Format calorie text with commas for thousands
  const formatCalories = (calories) => {
    return calories.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Calculate remaining calories
  const remaining = Math.max(target - consumed, 0);
  
  return (
    <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Daily Calories
      </h3>
      
      <div className="flex items-center">
        <div className="w-24 h-24 mr-4">
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              textSize: '1.5rem',
              textColor: isDarkMode ? 'white' : '#1F2937',
              pathColor: getProgressColor(),
              trailColor: isDarkMode ? '#4B5563' : '#E5E7EB',
            })}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Consumed
            </span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCalories(consumed)}
            </span>
          </div>
          
          <div className="flex justify-between mb-1">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Target
            </span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCalories(target)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Remaining
            </span>
            <span className={`font-medium ${
              isDarkMode 
                ? remaining > 0 ? 'text-green-400' : 'text-red-400'
                : remaining > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCalories(remaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

DailyCalorieProgress.propTypes = {
  consumed: PropTypes.number.isRequired,
  target: PropTypes.number.isRequired
};

export default DailyCalorieProgress; 
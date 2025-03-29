import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';

/**
 * General loading state component for page loading
 */
export const LoadingState = ({ text = 'Loading...' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
    </div>
  );
};

LoadingState.propTypes = {
  text: PropTypes.string
};

/**
 * Button with loading state
 */
export const LoadingButton = ({ 
  isLoading, 
  loadingText, 
  defaultText, 
  onClick, 
  disabled,
  className,
  type = 'button'
}) => {
  const { isDarkMode } = useTheme();
  const baseClass = `px-4 py-2 rounded-md text-white font-medium ${className || ''}`;
  
  const getButtonClass = () => {
    if (disabled || isLoading) {
      return `${baseClass} ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} cursor-not-allowed`;
    } else {
      return `${baseClass} ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`;
    }
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={getButtonClass()}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText || 'Loading...'}
        </div>
      ) : (
        defaultText
      )}
    </button>
  );
};

LoadingButton.propTypes = {
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  defaultText: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string
};

export default LoadingState; 
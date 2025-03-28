import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * LoadingState component that displays a loading spinner with an optional message
 * @param {Object} props
 * @param {string} [props.message="Loading..."] - Message to display while loading
 * @param {boolean} [props.fullScreen=false] - Whether to display as a full-screen overlay
 * @param {string} [props.size="medium"] - Size of the loading spinner (small, medium, large)
 */
const LoadingState = ({ message = "Loading...", fullScreen = false, size = "medium" }) => {
  const { isDarkMode } = useTheme();
  
  // Determine spinner size
  const spinnerSizes = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12"
  };
  
  const spinnerSize = spinnerSizes[size] || spinnerSizes.medium;
  
  // Full-screen loading overlay
  if (fullScreen) {
    return (
      <div 
        className={`fixed inset-0 flex flex-col items-center justify-center z-50 ${
          isDarkMode ? 'bg-gray-900 bg-opacity-80' : 'bg-white bg-opacity-80'
        }`}
      >
        <div className={`${spinnerSize} animate-spin rounded-full border-4 border-t-transparent ${
          isDarkMode ? 'border-blue-500' : 'border-blue-600'
        }`}></div>
        {message && (
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {message}
          </p>
        )}
      </div>
    );
  }
  
  // Inline loading state
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${spinnerSize} animate-spin rounded-full border-4 border-t-transparent ${
        isDarkMode ? 'border-blue-500' : 'border-blue-600'
      }`}></div>
      {message && (
        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * LoadingButton component that displays a loading spinner inside a button
 * @param {Object} props
 * @param {boolean} props.isLoading - Whether the button is in a loading state
 * @param {string} props.loadingText - Text to display while loading
 * @param {string} props.defaultText - Default button text
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.type="button"] - Button type
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 */
export const LoadingButton = ({
  isLoading,
  loadingText,
  defaultText,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  ...rest
}) => {
  const { isDarkMode } = useTheme();
  
  const baseClasses = `px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
    isDarkMode 
      ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400' 
      : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
  }`;
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${className} ${isLoading ? 'cursor-wait' : ''}`}
      onClick={onClick}
      disabled={isLoading || disabled}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText || defaultText}
        </span>
      ) : (
        defaultText
      )}
    </button>
  );
};

export default LoadingState; 
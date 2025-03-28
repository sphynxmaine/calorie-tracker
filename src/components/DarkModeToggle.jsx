import React from 'react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = ({ position = 'default' }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Define position styles based on the position prop
  const positionStyles = {
    default: {},
    'top-left': { position: 'fixed', top: '1rem', left: '1rem', zIndex: 50 },
    'top-right': { position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 },
    'inline': { position: 'relative' }
  };
  
  const currentPosition = positionStyles[position] || positionStyles.default;

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-full transition-all duration-300 shadow-lg ${
        isDarkMode 
          ? 'bg-blue-600' 
          : 'bg-gray-200'
      }`}
      aria-label="Toggle dark mode"
      style={{
        width: '51px',
        height: '31px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2px',
        ...currentPosition
      }}
    >
      <div 
        className={`rounded-full flex items-center justify-center transform transition-all duration-300 ${
          isDarkMode ? 'bg-white' : 'bg-white'
        }`}
        style={{
          width: '27px',
          height: '27px',
          transform: isDarkMode ? 'translateX(20px)' : 'translateX(0)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <span className="text-sm">
          {isDarkMode ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
};

export default DarkModeToggle; 
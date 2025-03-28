import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { logOut } from '../auth';
import DarkModeToggle from './DarkModeToggle';

const PageHeader = ({ 
  title, 
  showBackButton = false, 
  rightAction, 
  onRightActionClick,
  rightText,
  isProfilePage = false
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header 
      className={`relative flex items-center justify-between p-4 shadow-sm transition-colors duration-200`}
      style={{ 
        background: isDarkMode 
          ? 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' 
          : 'linear-gradient(180deg, #F3F4F6 0%, #FFFFFF 100%)'
      }}
    >
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 flex items-center justify-center"
            style={{ color: 'var(--text-primary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <DarkModeToggle />
      </div>
      
      <h1 
        className="absolute left-1/2 transform -translate-x-1/2 text-lg font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
      
      {isProfilePage ? (
        rightText && (
          <span className="text-blue-600">{rightText}</span>
        )
      ) : (
        <button 
          onClick={handleLogout}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } transition-colors duration-200`}
        >
          Logout
        </button>
      )}
    </header>
  );
};

export default PageHeader; 
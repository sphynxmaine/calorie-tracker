import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebase';

const MobileNavbar = ({ onAddFood }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Track screen size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update the selected tab when location changes
  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/' || path.includes('dashboard')) {
      setSelectedTab('dashboard');
    } else if (path.includes('food-database')) {
      setSelectedTab('foods');
    } else if (path.includes('calculator')) {
      setSelectedTab('calc');
    } else if (path.includes('profile')) {
      setSelectedTab('profile');
    } else if (path.includes('resources')) {
      setSelectedTab('resources');
    }
  }, [location]);

  const handleNavigation = (path, tabName) => {
    setSelectedTab(tabName);
    navigate(path);
  };

  const handleAddFood = () => {
    setIsAddMenuOpen(!isAddMenuOpen);
    // If we're already on the dashboard and the menu is opening, trigger the add food action
    if (location.pathname === '/' && !isAddMenuOpen) {
      onAddFood && onAddFood();
    }
  };

  const getTabClass = (tab) => {
    return selectedTab === tab
      ? `${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
      : `${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
  };

  return (
    <>
      {/* Overlay when add menu is open */}
      {isAddMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsAddMenuOpen(false)}
        ></div>
      )}
      
      <div className={`fixed bottom-0 w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-40 pt-2 pb-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-around items-center">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation('/', 'dashboard')}
            className={`flex flex-col items-center ${getTabClass('dashboard')} px-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Dashboard</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => handleNavigation('/profile', 'profile')}
            className={`flex flex-col items-center ${getTabClass('profile')} px-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </button>

          {/* Add Food (center button) */}
          <div className="relative">
            <button
              onClick={handleAddFood}
              className={`flex flex-col items-center justify-center ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded-full p-3 -mt-5 shadow-lg transition-all duration-300 transform ${isAddMenuOpen ? 'rotate-45' : 'rotate-0'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            {/* Add menu popup */}
            {isAddMenuOpen && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 z-50 animate-fade-in">
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      onAddFood && onAddFood();
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Food Entry
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/food-database/add');
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Add New Food
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Calculator */}
          <button
            onClick={() => handleNavigation('/calculator', 'calc')}
            className={`flex flex-col items-center ${getTabClass('calc')} px-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Calc</span>
          </button>

          {/* Food Database */}
          <button
            onClick={() => handleNavigation('/food-database', 'foods')}
            className={`flex flex-col items-center ${getTabClass('foods')} px-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
            <span className="text-xs mt-1">Foods</span>
          </button>
          
          {/* Resources */}
          <button
            onClick={() => handleNavigation('/resources', 'resources')}
            className={`flex flex-col items-center ${getTabClass('resources')} px-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs mt-1">Resources</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavbar; 
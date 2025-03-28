import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const MobileNavbar = ({ isAdmin }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  
  // Close the add menu when changing pages
  useEffect(() => {
    setShowAddMenu(false);
  }, [location.pathname]);

  // Add click outside listener to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the menu is shown and the click is outside the menu and the button
      if (
        showAddMenu && 
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        btnRef.current &&
        !btnRef.current.contains(event.target)
      ) {
        setShowAddMenu(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

  // Helper function to determine if a route is active
  const isActive = (path) => location.pathname === path;

  const handleAddButtonClick = () => {
    setShowAddMenu(prev => !prev);
  };

  // Function to dispatch the addFood event with meal type
  const triggerAddFood = (meal) => {
    // If we're not on the dashboard, navigate there first
    if (location.pathname !== '/') {
      // Store the meal info in session storage for persistence during navigation
      sessionStorage.setItem('pendingAddFood', JSON.stringify({ 
        meal, 
        timestamp: Date.now() 
      }));
      navigate('/');
    } else {
      // If already on dashboard, just trigger the event
      window.dispatchEvent(new CustomEvent('openAddFoodModal', { 
        detail: { meal } 
      }));
    }
    setShowAddMenu(false);
  };

  // Check for pending food add when component mounts or location changes
  useEffect(() => {
    if (location.pathname === '/') {
      const pendingAddFood = sessionStorage.getItem('pendingAddFood');
      if (pendingAddFood) {
        try {
          const { meal, timestamp } = JSON.parse(pendingAddFood);
          
          // Only process if the pending request is less than 10 seconds old
          if (Date.now() - timestamp < 10000) {
            // Wait a moment for Dashboard to fully mount
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openAddFoodModal', { 
                detail: { meal } 
              }));
            }, 500);
          }
          
          // Clear the pending request
          sessionStorage.removeItem('pendingAddFood');
        } catch (error) {
          console.error('Error processing pending add food request:', error);
          sessionStorage.removeItem('pendingAddFood');
        }
      }
    }
  }, [location.pathname]);

  // Navigate to page with active effect
  const navigateTo = (path) => {
    if (location.pathname !== path) {
      // Add a small animation effect
      const navbarElement = document.querySelector('.mobile-navbar');
      if (navbarElement) {
        navbarElement.classList.add('nav-transition');
        setTimeout(() => {
          navbarElement.classList.remove('nav-transition');
        }, 300);
      }
      
      // Perform the navigation
      navigate(path);
    }
  };

  return (
    <div className="relative z-50">
      {/* Add Menu Popup */}
      {showAddMenu && (
        <div 
          ref={menuRef}
          className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 w-64 p-2 rounded-xl shadow-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}
        >
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <button 
              onClick={() => triggerAddFood('breakfast')}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 mr-3 rounded-full ${isDarkMode ? 'bg-yellow-800' : 'bg-yellow-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <div className="flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Breakfast</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add food to breakfast</div>
              </div>
            </button>
            
            <button 
              onClick={() => triggerAddFood('lunch')}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 mr-3 rounded-full ${isDarkMode ? 'bg-blue-800' : 'bg-blue-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div className="flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Lunch</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add food to lunch</div>
              </div>
            </button>
            
            <button 
              onClick={() => triggerAddFood('dinner')}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 mr-3 rounded-full ${isDarkMode ? 'bg-green-800' : 'bg-green-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </span>
              <div className="flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Dinner</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add food to dinner</div>
              </div>
            </button>
            
            <button 
              onClick={() => triggerAddFood('snacks')}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 mr-3 rounded-full ${isDarkMode ? 'bg-purple-800' : 'bg-purple-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div className="flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Snack</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add food to snacks</div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                setShowAddMenu(false);
                navigateTo('/log-weight');
              }}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 mr-3 rounded-full ${isDarkMode ? 'bg-red-800' : 'bg-red-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <div className="flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Log Weight</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Record your weight</div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                setShowAddMenu(false);
                navigateTo('/food-database');
              }}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 mr-3 rounded-full ${isDarkMode ? 'bg-indigo-800' : 'bg-indigo-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              <div className="flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Food Database</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Browse & add foods</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navbar */}
      <div className={`mobile-navbar ${
        isDarkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'
      } px-6 shadow-xl rounded-t-2xl`}>
        <div className="flex items-center justify-between h-full">
          {/* Dashboard */}
          <button 
            onClick={() => navigateTo('/')}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              isActive('/') 
                ? 'text-blue-500 transform scale-110 font-medium' 
                : isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className={`p-2 rounded-full ${isActive('/') ? (isDarkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-14 0l2 2m0 0l7 7-7-7m14 0l-2-2m0 0l-7-7-7 7" />
              </svg>
            </div>
            <span className="text-xs mt-1">Home</span>
          </button>
          
          {/* Add Button (centered) */}
          <button 
            ref={btnRef}
            onClick={handleAddButtonClick}
            className={`relative flex flex-col items-center justify-center transform -translate-y-5 transition-all duration-300 ${showAddMenu ? 'rotate-45' : ''}`}
          >
            <div className={`h-14 w-14 flex items-center justify-center rounded-full shadow-lg ${
              isDarkMode 
                ? 'bg-gradient-to-tr from-blue-600 to-blue-400' 
                : 'bg-gradient-to-tr from-blue-500 to-blue-400'
            } text-white`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </button>
          
          {/* Profile */}
          <button 
            onClick={() => navigateTo('/profile')}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              isActive('/profile') 
                ? 'text-blue-500 transform scale-110 font-medium' 
                : isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className={`p-2 rounded-full ${isActive('/profile') ? (isDarkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs mt-1">Profile</span>
          </button>

          {/* Graphs */}
          <button 
            onClick={() => navigateTo('/graphs')}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              isActive('/graphs') 
                ? 'text-blue-500 transform scale-110 font-medium' 
                : isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className={`p-2 rounded-full ${isActive('/graphs') ? (isDarkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-xs mt-1">Graphs</span>
          </button>
        </div>
      </div>

      {/* Add CSS styles for transitions */}
      <style jsx="true">{`
        .mobile-navbar {
          height: 70px;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          transition: transform 0.3s ease-in-out;
        }
        
        .nav-transition {
          transform: translateY(5px);
        }
        
        .btn-bounce:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default MobileNavbar; 
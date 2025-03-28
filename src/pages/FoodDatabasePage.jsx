import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FoodSearch from '../components/FoodSearch';
import AddFoodToDiaryModal from '../components/AddFoodToDiaryModal';
import { useTheme } from '../context/ThemeContext';
import { useUpdate } from '../context/UpdateContext';
import PageHeader from '../components/PageHeader';
import { auth } from '../firebase';
import AddCustomFoodForm from '../components/AddCustomFoodForm';
import { deleteCustomFood } from '../data/userFoodDatabase';

/**
 * Food Database Page - 2025 Edition
 * Streamlined interface for searching and contributing foods
 */
const FoodDatabasePage = ({ addMode = false, customMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { addNotification } = useUpdate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('search');
  const [selectedFood, setSelectedFood] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Set the active tab based on the location state or props
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state to prevent it from persisting on refresh
      navigate(location.pathname, { replace: true, state: {} });
    } else if (addMode || customMode) {
      setActiveTab('contribute');
    }
  }, [location, addMode, customMode, navigate]);
  
  // Handle selecting a food item to add to diary
  const handleSelectFood = (food) => {
    if (!auth.currentUser) {
      addNotification({
        message: "Sign in to add foods to your diary",
        type: "error"
      });
      return;
    }
    
    setSelectedFood(food);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFood(null);
  };
  
  // Handle successful food addition
  const handleFoodAdded = (newFood, addToDiary = false) => {
    // Show success notification
    addNotification({
      message: `${newFood.isRecipe ? 'Recipe' : 'Food'} added to database`,
      type: "success"
    });
    
    // If user chose to add to diary, open the diary modal
    if (addToDiary) {
      handleSelectFood(newFood);
    }
  };

  // Handle food deletion
  const handleDeleteFood = (foodId) => {
    if (!auth.currentUser) {
      addNotification({
        message: "Sign in to manage foods",
        type: "error"
      });
      return;
    }
    
    deleteCustomFood(foodId)
      .then(() => {
        addNotification({
          message: "Food removed from database",
          type: "success"
        });
      })
      .catch(error => {
        console.error("Error deleting food:", error);
        addNotification({
          message: "Unable to remove food",
          type: "error"
        });
      });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="sticky top-0 z-10">
        <PageHeader
          title="Food Database"
          showBackButton={true}
        />
        
        {/* 2025 Navigation Bar */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="container mx-auto px-4">
            <div className="flex justify-center space-x-1 sm:space-x-4">
              <button
                className={`py-4 px-6 font-medium text-center transition-all duration-200 relative ${
                  activeTab === 'search'
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-indigo-600'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('search')}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <span>Search</span>
                </div>
                {activeTab === 'search' && (
                  <span className={`absolute bottom-0 left-0 right-0 h-1 ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}></span>
                )}
              </button>
              
              <button
                className={`py-4 px-6 font-medium text-center transition-all duration-200 relative ${
                  activeTab === 'contribute'
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-indigo-600'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('contribute')}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Contribute</span>
                </div>
                {activeTab === 'contribute' && (
                  <span className={`absolute bottom-0 left-0 right-0 h-1 ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Tab content with modern design */}
        <div className="pb-24">
          {activeTab === 'search' && (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <FoodSearch 
                onSelectFood={handleSelectFood} 
                onDeleteFood={handleDeleteFood}
              />
            </div>
          )}
          
          {activeTab === 'contribute' && (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {location.state?.isRecipe ? 'Add Recipe' : 'Add Food'}
                  </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {location.state?.isRecipe 
                      ? 'Share your recipes with the community'
                      : 'Contribute food data to our shared database'}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  {!location.state?.isRecipe && (
                    <button
                      onClick={() => {
                        navigate(location.pathname, { replace: true, state: { isRecipe: true } });
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      } shadow-sm`}
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Add Recipe Instead
                      </span>
                    </button>
                  )}
                  {location.state?.isRecipe && (
                    <button
                      onClick={() => {
                        navigate(location.pathname, { replace: true, state: { isRecipe: false } });
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                      } shadow-sm`}
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Add Food Instead
                      </span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`bg-opacity-50 rounded-lg p-4 mb-6 flex items-start space-x-3 ${
                isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-50 text-indigo-700'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">
                  {location.state?.isRecipe 
                    ? 'All recipes you create will be shared with the community. This helps build our food database for everyone.'
                    : 'All foods you add will be shared with the community. Your contribution helps build our comprehensive database.'}
                </p>
              </div>
              
              <AddCustomFoodForm 
                isRecipe={location.state?.isRecipe || false}
                onSuccess={handleFoodAdded}
                alwaysPublic={true}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Add Food to Diary Modal */}
      {showModal && selectedFood && (
        <AddFoodToDiaryModal 
          food={selectedFood} 
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default FoodDatabasePage; 
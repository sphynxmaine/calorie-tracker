import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchAllFoods, DATABASE_SOURCES } from '../data/foodDatabaseService';
import AddFoodToDiaryModal from '../components/AddFoodToDiaryModal';
import PageHeader from '../components/PageHeader';

const ResourcesPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFood, setSelectedFood] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Foods');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const tabs = ['Foods', 'Recent Meals', 'My Foods', 'My Recipes'];
  
  useEffect(() => {
    fetchFoods();
  }, [activeTab]);
  
  // Check if we received a tab selection from navigation
  useEffect(() => {
    if (location.state?.activeTab && tabs.includes(location.state.activeTab)) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  
  const fetchFoods = async () => {
    try {
      setLoading(true);
      
      let source = DATABASE_SOURCES.ALL;
      if (activeTab === 'My Foods') {
        source = DATABASE_SOURCES.USER;
      }
      
      const results = await searchAllFoods({
        query: searchQuery,
        source: source,
        sortBy: 'name',
        sortDirection: 'asc',
        limit: 100
      });
      
      setFoods(results);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFoods();
  };
  
  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFood(null);
  };
  
  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <PageHeader 
        title="Food Database"
        showBackButton={true}
        onRightActionClick={() => navigate('/')}
      />
      
      {/* Search Bar */}
      <div className="px-4 py-3 bg-opacity-50">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={handleSearch}
              className={`w-full pl-10 pr-12 py-3 rounded-xl ${
                isDarkMode 
                  ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700' 
                  : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchFoods();
                }}
                className="absolute inset-y-0 right-12 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
      
      {/* Tabs */}
      <div className={`flex overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-3`}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-5 py-3 whitespace-nowrap font-medium transition-colors duration-200 ${
              activeTab === tab
                ? isDarkMode
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Food List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="px-4">
            {foods.length > 0 ? (
              <>
                <div className={`my-2 text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {searchQuery ? `SEARCH RESULTS (${foods.length})` : `FOOD DATABASE (${foods.length})`}
                </div>
                <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {foods.map((food) => (
                    <div 
                      key={food.id} 
                      className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition-colors duration-200`}
                      onClick={() => handleSelectFood(food)}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {food.itemName || food.name}
                        </div>
                        {food.calories && (
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {food.calories} cal per serving
                          </div>
                        )}
                      </div>
                      <svg className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </>
            ) : searchQuery ? (
              <div className={`my-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">No foods found matching "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className={`mt-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className={`my-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg">Search for a food to get started</p>
              </div>
            )}
          </div>
        )}
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

export default ResourcesPage; 
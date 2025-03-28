import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useUpdate } from '../context/UpdateContext';

const AddFood = () => {
  const { isDarkMode } = useTheme();
  const { addPendingUpdate, isOnline } = useUpdate();
  const navigate = useNavigate();
  
  const [food, setFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: '',
    servingUnit: 'g',
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFood(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (!food.name.trim()) {
      alert('Please enter a food name');
      setLoading(false);
      return;
    }
    
    try {
      // Use UpdateContext to handle the food addition with real-time updates
      addPendingUpdate(
        'ADD_FOOD', 
        food, 
        (result) => {
          // Success callback
          setLoading(false);
          // Reset form
          setFood({
            name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            servingSize: '',
            servingUnit: 'g',
          });
          // Navigate back to food database
          navigate('/food-database');
        },
        (error) => {
          // Error callback
          setLoading(false);
          console.error('Error adding food:', error);
        }
      );
    } catch (error) {
      setLoading(false);
      console.error('Error adding food:', error);
    }
  };
  
  const inputClasses = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? 'bg-dark-bg-secondary text-dark-text-primary border-dark-border focus:border-blue-500'
      : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
  } focus:outline-none transition-colors duration-200`;
  
  const buttonClasses = `w-full py-2 rounded-lg font-medium ${
    isDarkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white'
  } transition-colors duration-200`;
  
  return (
    <div className={`p-4 rounded-lg shadow-md ${
      isDarkMode ? 'bg-dark-bg-secondary' : 'bg-white'
    } transition-colors duration-200`}>
      <h2 className={`text-2xl font-bold mb-4 ${
        isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
      }`}>
        Add Food
      </h2>
      
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-lg">
          You are offline. The food will be added when you reconnect.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="name" 
            className={`block mb-1 font-medium ${
              isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
            }`}
          >
            Food Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={food.name}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g. Apple"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label 
              htmlFor="calories" 
              className={`block mb-1 font-medium ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}
            >
              Calories
            </label>
            <input
              type="number"
              id="calories"
              name="calories"
              value={food.calories}
              onChange={handleChange}
              className={inputClasses}
              placeholder="kcal"
              min="0"
            />
          </div>
          
          <div>
            <label 
              htmlFor="servingSize" 
              className={`block mb-1 font-medium ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}
            >
              Serving Size
            </label>
            <div className="flex">
              <input
                type="number"
                id="servingSize"
                name="servingSize"
                value={food.servingSize}
                onChange={handleChange}
                className={`${inputClasses} rounded-r-none`}
                placeholder="100"
                min="0"
              />
              <select
                name="servingUnit"
                value={food.servingUnit}
                onChange={handleChange}
                className={`${inputClasses} rounded-l-none w-auto border-l-0`}
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="oz">oz</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label 
              htmlFor="protein" 
              className={`block mb-1 font-medium ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}
            >
              Protein
            </label>
            <input
              type="number"
              id="protein"
              name="protein"
              value={food.protein}
              onChange={handleChange}
              className={inputClasses}
              placeholder="g"
              min="0"
            />
          </div>
          
          <div>
            <label 
              htmlFor="carbs" 
              className={`block mb-1 font-medium ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}
            >
              Carbs
            </label>
            <input
              type="number"
              id="carbs"
              name="carbs"
              value={food.carbs}
              onChange={handleChange}
              className={inputClasses}
              placeholder="g"
              min="0"
            />
          </div>
          
          <div>
            <label 
              htmlFor="fat" 
              className={`block mb-1 font-medium ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}
            >
              Fat
            </label>
            <input
              type="number"
              id="fat"
              name="fat"
              value={food.fat}
              onChange={handleChange}
              className={inputClasses}
              placeholder="g"
              min="0"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/food-database')}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDarkMode
                ? 'bg-dark-bg-primary hover:bg-gray-700 text-dark-text-primary'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } transition-colors duration-200`}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className={`${buttonClasses} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Add Food'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFood; 
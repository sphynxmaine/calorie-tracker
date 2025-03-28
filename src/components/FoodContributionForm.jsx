import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db, standardizeFoodData } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { isValidNumber, parseNumberOrZero } from '../utils/helpers';

const FoodContributionForm = ({ onSave, onCancel, initialFood = null }) => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(initialFood?.name || '');
  const [brand, setBrand] = useState(initialFood?.brand || '');
  const [calories, setCalories] = useState(initialFood?.calories || '');
  const [protein, setProtein] = useState(initialFood?.protein || '');
  const [carbs, setCarbs] = useState(initialFood?.carbs || '');
  const [fat, setFat] = useState(initialFood?.fat || '');
  const [fiber, setFiber] = useState(initialFood?.fiber || '');
  const [sugar, setSugar] = useState(initialFood?.sugar || '');
  const [servingSize, setServingSize] = useState(initialFood?.servingSize || '100');
  const [servingUnit, setServingUnit] = useState(initialFood?.servingUnit || 'g');
  const [country, setCountry] = useState(initialFood?.country || 'australia');

  const countries = [
    { value: 'australia', label: 'Australia' },
    { value: 'unitedStates', label: 'United States' },
    { value: 'unitedKingdom', label: 'United Kingdom' },
    { value: 'canada', label: 'Canada' },
    { value: 'newZealand', label: 'New Zealand' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate required fields
      if (!name.trim()) {
        setError('Food name is required');
        return;
      }
      
      // Validate numeric fields
      if (!isValidNumber(calories) || parseFloat(calories) < 0) {
        setError('Please enter valid calories');
        return;
      }
      
      if (!isValidNumber(servingSize) || parseFloat(servingSize) <= 0) {
        setError('Please enter a valid serving size');
        return;
      }
      
      setIsLoading(true);
      
      // Prepare food data
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('You must be logged in to contribute food');
        setIsLoading(false);
        return;
      }
      
      const foodData = standardizeFoodData({
        name: name.trim(),
        brand: brand.trim() || null,
        calories: parseNumberOrZero(calories),
        protein: parseNumberOrZero(protein),
        carbs: parseNumberOrZero(carbs),
        fat: parseNumberOrZero(fat),
        fiber: parseNumberOrZero(fiber),
        sugar: parseNumberOrZero(sugar),
        servingSize: parseNumberOrZero(servingSize),
        servingUnit: servingUnit,
        userId,
        country,
        source: 'custom',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approved: true // User's personal foods are always approved for their use
      });
      
      // Use the appropriate collection based on whether this is a personal or community contribution
      const collectionName = 'customFoods';
      const docRef = await addDoc(collection(db, collectionName), foodData);
      
      // Add the ID to the food data
      const savedFood = {
        ...foodData,
        id: docRef.id
      };
      
      setIsLoading(false);
      
      // Call the onSave callback with the saved food
      if (onSave) {
        onSave(savedFood);
      }
    } catch (error) {
      console.error('Error adding food:', error);
      setError('Failed to save food. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Helper for input styles based on dark mode
  const getInputStyles = () => {
    return `w-full p-2 rounded-md border ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600 text-white' 
        : 'bg-white border-gray-300 text-gray-900'
    }`;
  };
  
  // Helper for label styles
  const getLabelStyles = () => {
    return `block text-sm font-medium mb-1 ${
      isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {/* Food details section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className={getLabelStyles()}>
            Food Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={getInputStyles()}
            placeholder="e.g., Banana"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="brand" className={getLabelStyles()}>
            Brand (optional)
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={getInputStyles()}
            placeholder="e.g., Kellogg's"
          />
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="country" className={getLabelStyles()}>
            Country of Origin
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={getInputStyles()}
          >
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Nutrition section */}
      <div className="mt-4">
        <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Nutrition Information
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="calories" className={getLabelStyles()}>
              Calories *
            </label>
            <input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 100"
              min="0"
              step="1"
              required
            />
          </div>
          
          <div>
            <label htmlFor="protein" className={getLabelStyles()}>
              Protein (g)
            </label>
            <input
              id="protein"
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 5"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label htmlFor="carbs" className={getLabelStyles()}>
              Carbs (g)
            </label>
            <input
              id="carbs"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 20"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label htmlFor="fat" className={getLabelStyles()}>
              Fat (g)
            </label>
            <input
              id="fat"
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 2"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label htmlFor="fiber" className={getLabelStyles()}>
              Fiber (g)
            </label>
            <input
              id="fiber"
              type="number"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 3"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label htmlFor="sugar" className={getLabelStyles()}>
              Sugar (g)
            </label>
            <input
              id="sugar"
              type="number"
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 10"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>
      
      {/* Serving section */}
      <div className="mt-4">
        <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Serving Information
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="servingSize" className={getLabelStyles()}>
              Serving Size *
            </label>
            <input
              id="servingSize"
              type="number"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              className={getInputStyles()}
              placeholder="e.g., 100"
              min="0"
              step="1"
              required
            />
          </div>
          
          <div>
            <label htmlFor="servingUnit" className={getLabelStyles()}>
              Unit *
            </label>
            <select
              id="servingUnit"
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
              className={getInputStyles()}
              required
            >
              <option value="g">grams (g)</option>
              <option value="ml">milliliters (ml)</option>
              <option value="oz">ounces (oz)</option>
              <option value="cups">cups</option>
              <option value="serving">serving</option>
              <option value="piece">piece</option>
              <option value="tbsp">tablespoon</option>
              <option value="tsp">teaspoon</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded-md ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : 'Save Food'}
        </button>
      </div>
    </form>
  );
};

export default FoodContributionForm; 
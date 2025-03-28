import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const FoodContributionForm = ({ onSave, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [food, setFood] = useState({
    name: '',
    brand: '',
    servingSize: '100',
    servingUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    country: 'australia', // Default to Australia
  });

  // Available countries for food database
  const countries = [
    { value: 'australia', label: 'Australia' },
    { value: 'unitedStates', label: 'United States' },
    { value: 'unitedKingdom', label: 'United Kingdom' },
    { value: 'canada', label: 'Canada' },
    { value: 'newZealand', label: 'New Zealand' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFood(prevFood => ({
      ...prevFood,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Validate required fields
      if (!food.name || !food.calories) {
        throw new Error("Food name and calories are required");
      }

      // Convert nutrition values to numbers
      const foodEntry = {
        ...food,
        calories: parseFloat(food.calories) || 0,
        protein: parseFloat(food.protein) || 0,
        carbs: parseFloat(food.carbs) || 0,
        fat: parseFloat(food.fat) || 0,
        servingSize: parseFloat(food.servingSize) || 100,
        userId: userId,
        approved: false, // Requires admin approval
        createdAt: new Date().toISOString(),
        country: food.country || 'australia' // Include country data
      };

      // Add to userFoods collection
      const docRef = await addDoc(collection(db, "userFoods"), foodEntry);
      console.log("Food contributed:", foodEntry);
      
      // Show success message
      setSuccess(true);
      setTimeout(() => {
        if (onSave) {
          onSave(foodEntry);
        }
      }, 1000);
    } catch (error) {
      console.error("Error contributing food:", error);
      alert(error.message || "Error saving food. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      {/* Insert the Country field before the Submit button */}
      <div>
        <label className="block text-sm font-medium mb-1">Country</label>
        <select
          name="country"
          value={food.country}
          onChange={handleChange}
          className={`w-full p-2 rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } border focus:ring-2 focus:ring-blue-500`}
        >
          {countries.map(country => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">Select the country where this food is commonly found.</p>
      </div>
      
      {/* Basic Details */}
      <div>
        <label className="block text-sm font-medium mb-1">Food Name*</label>
        <input
          type="text"
          name="name"
          value={food.name}
          onChange={handleChange}
          required
          className={`w-full p-2 rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } border focus:ring-2 focus:ring-blue-500`}
          placeholder="e.g., Chicken Breast"
        />
      </div>
      
      {/* ... rest of the existing form fields ... */}
      
      {/* Submit Button */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : success ? (
            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            "Save Food"
          )}
        </button>
      </div>
    </form>
  );
};

export default FoodContributionForm; 
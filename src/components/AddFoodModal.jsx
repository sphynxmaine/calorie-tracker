import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from './PageHeader';
import { searchFoods } from '../data/foodDatabase';

const AddFoodModal = ({ isOpen, onClose, onAddFood, selectedMeal, selectedDate }) => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: search, 2: details

  useEffect(() => {
    if (isOpen && searchTerm.length > 2) {
      searchFoodsFromDB();
    }
  }, [searchTerm, isOpen]);

  const searchFoodsFromDB = async () => {
    if (searchTerm.length < 2) return;

    try {
      setLoading(true);
      
      // Use the local food database instead of Firebase
      const results = searchFoods(searchTerm);
      
      setSearchResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error searching foods:', error);
      setLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setStep(2);
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      // Get proper food name
      const foodName = selectedFood.name || selectedFood.itemName || selectedFood.foodName || "Food";

      // Calculate adjusted nutrition based on amount
      const adjustedFood = {
        ...selectedFood,
        calories: Math.round(selectedFood.calories * amount),
        protein: Math.round(selectedFood.protein * amount * 10) / 10,
        carbs: Math.round(selectedFood.carbs * amount * 10) / 10,
        fat: Math.round(selectedFood.fat * amount * 10) / 10,
        amount
      };

      // Get date string - use selectedDate prop if provided, otherwise use today's date
      const dateString = selectedDate || new Date().toISOString().split('T')[0];
      
      console.log(`Adding food to ${selectedMeal} for date: ${dateString}`);

      // Add to Firebase
      await addDoc(collection(db, 'foodEntries'), {
        userId,
        foodId: selectedFood.id || null,
        foodName: foodName,         // Use consistent field name
        name: foodName,             // Add backup name field
        servings: amount,           // Add servings field for consistency
        amount,
        calories: adjustedFood.calories,
        protein: adjustedFood.protein,
        carbs: adjustedFood.carbs,
        fat: adjustedFood.fat,
        meal: selectedMeal.toLowerCase(),
        date: dateString,
        createdAt: serverTimestamp(),
        displayName: foodName,      // Add displayName field
        displayAmount: amount       // Add displayAmount field
      });

      // Call the onAddFood callback
      onAddFood(adjustedFood, selectedMeal);
      
      // Reset state
      setSelectedFood(null);
      setAmount(1);
      setStep(1);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error adding food to diary:', error);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`w-full h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {step === 1 ? (
          <>
            <PageHeader 
              title={`Add Food to ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}`}
              showBackButton={true}
              onRightActionClick={onClose}
            />
            <div className="p-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full p-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-700' 
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-y-auto h-[calc(100vh-180px)]">
                  {searchResults.map((food) => (
                    <div
                      key={food.id}
                      className={`p-4 mb-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                      } cursor-pointer`}
                      onClick={() => handleSelectFood(food)}
                    >
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {food.name}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {food.calories} calories per {food.servingSize || 'serving'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <PageHeader 
              title="Food Details"
              showBackButton={true}
              onRightActionClick={() => setStep(1)}
              rightText="Back"
            />
            <div className="p-4">
              <div className={`text-xl font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedFood?.name}
              </div>

              <div className="mb-4">
                <label className={`block mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Amount (servings)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className={`w-full p-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-700' 
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Calories
                    </div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Math.round(selectedFood?.calories * amount)} cal
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Protein
                    </div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(selectedFood?.protein * amount).toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Carbs
                    </div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(selectedFood?.carbs * amount).toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Fat
                    </div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(selectedFood?.fat * amount).toFixed(1)}g
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddFood}
                className={`w-full py-3 px-4 rounded-lg ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-medium shadow`}
              >
                Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddFoodModal;
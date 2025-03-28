import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db, auth } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import PageHeader from './PageHeader';

const EditFoodModal = ({ isOpen, onClose, onUpdateFood, onDeleteFood, foodItem, selectedMeal, selectedDate }) => {
  const { isDarkMode } = useTheme();
  const [amount, setAmount] = useState(foodItem?.amount || 1);
  const [calculatedNutrition, setCalculatedNutrition] = useState({
    calories: foodItem?.calories || 0,
    protein: foodItem?.protein || 0, 
    carbs: foodItem?.carbs || 0,
    fat: foodItem?.fat || 0
  });
  
  // Available meal types
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const [meal, setMeal] = useState(selectedMeal || 'breakfast');
  
  // Calculate nutrition based on amount changes
  useEffect(() => {
    if (!foodItem) return;
    
    // Calculate per-unit values
    const baseCalories = foodItem.calories / foodItem.amount;
    const baseProtein = foodItem.protein / foodItem.amount;
    const baseCarbs = foodItem.carbs / foodItem.amount;
    const baseFat = foodItem.fat / foodItem.amount;
    
    // Calculate new values based on current amount
    setCalculatedNutrition({
      calories: Math.round(baseCalories * amount),
      protein: parseFloat((baseProtein * amount).toFixed(1)),
      carbs: parseFloat((baseCarbs * amount).toFixed(1)),
      fat: parseFloat((baseFat * amount).toFixed(1))
    });
  }, [amount, foodItem]);

  const handleUpdateFood = async () => {
    if (!foodItem || !foodItem.id) return;
    
    try {
      const foodRef = doc(db, "foodEntries", foodItem.id);
      
      // Update the food entry
      await updateDoc(foodRef, {
        amount: parseFloat(amount),
        calories: calculatedNutrition.calories,
        protein: calculatedNutrition.protein,
        carbs: calculatedNutrition.carbs,
        fat: calculatedNutrition.fat,
        meal: meal
      });
      
      // Call the onUpdateFood callback
      onUpdateFood({
        ...foodItem,
        amount: parseFloat(amount),
        calories: calculatedNutrition.calories,
        protein: calculatedNutrition.protein,
        carbs: calculatedNutrition.carbs,
        fat: calculatedNutrition.fat,
        meal: meal
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating food entry:', error);
    }
  };

  const handleDelete = async () => {
    if (!foodItem || !foodItem.id) return;
    
    if (window.confirm('Are you sure you want to delete this food entry?')) {
      try {
        await onDeleteFood(foodItem.id);
        onClose();
      } catch (error) {
        console.error('Error deleting food entry:', error);
      }
    }
  };

  if (!isOpen || !foodItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`w-full h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <PageHeader 
          title="Edit Food"
          showBackButton={true}
          onRightActionClick={onClose}
        />
        
        <div className="p-4">
          <div className={`text-xl font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {foodItem.foodName || foodItem.name}
          </div>

          {/* Amount Input */}
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

          {/* Meal Type Selector */}
          <div className="mb-4">
            <label className={`block mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Meal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((mealType) => (
                <button
                  key={mealType}
                  type="button"
                  className={`p-2 rounded-lg ${
                    meal === mealType 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => setMeal(mealType)}
                >
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Calories
                </div>
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calculatedNutrition.calories} cal
                </div>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Protein
                </div>
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calculatedNutrition.protein}g
                </div>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Carbs
                </div>
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calculatedNutrition.carbs}g
                </div>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Fat
                </div>
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {calculatedNutrition.fat}g
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleUpdateFood}
              className={`flex-1 py-3 px-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-medium shadow`}
            >
              Update
            </button>
            
            <button
              onClick={handleDelete}
              className={`py-3 px-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white font-medium shadow`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFoodModal; 
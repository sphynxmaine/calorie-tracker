import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddCustomFoodForm = ({ isRecipe = false, onSuccess, alwaysPublic = false }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    itemName: '',
    servingSize: '100',
    servingUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    category: '',
    notes: '',
    instructions: isRecipe ? '' : undefined,
    totalServings: isRecipe ? 1 : undefined,
    ingredients: isRecipe ? [] : undefined,
    addToDiary: false,
    isPublic: alwaysPublic // Set to true if alwaysPublic is enabled
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Additional state for ingredient management
  const [ingredient, setIngredient] = useState({
    name: '',
    amount: '',
    unit: 'g'
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // If alwaysPublic is true and the field is isPublic, ignore the change
    if (alwaysPublic && name === 'isPublic') return;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    // Basic validation
    if (!formData.itemName.trim()) {
      setError("Food name is required");
      return;
    }
    
    if (!formData.calories || isNaN(formData.calories)) {
      setError("Valid calories are required");
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to add foods");
      }
      
      // Prepare data for Firebase
      const newFood = {
        itemName: formData.itemName.trim(),
        name: formData.itemName.trim(), // Add name as well for compatibility
        servingSize: formData.servingSize || "100",
        servingUnit: formData.servingUnit || "g",
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fat: Number(formData.fat) || 0,
        category: formData.category || "Uncategorized",
        notes: formData.notes || "",
        userId: auth.currentUser.uid,
        isRecipe: isRecipe,
        ingredients: isRecipe ? formData.ingredients : [],
        createdAt: serverTimestamp(),
        // Always public if alwaysPublic is true
        isPublic: alwaysPublic ? true : formData.isPublic
      };
      
      // Add to Firestore as user food
      const docRef = await addDoc(collection(db, "userFoods"), newFood);
      
      // Include the ID in the returned object
      const newFoodWithId = {
        id: docRef.id,
        ...newFood,
        createdAt: new Date() // For immediate UI update
      };
      
      // If the food is marked as public or alwaysPublic is true, also add it to the shared foods collection
      if (newFood.isPublic) {
        try {
          // Prepare shared food data
          const sharedFood = {
            itemName: newFood.itemName,
            servingSize: newFood.servingSize,
            servingUnit: newFood.servingUnit,
            calories: newFood.calories,
            protein: newFood.protein,
            carbs: newFood.carbs,
            fat: newFood.fat,
            category: newFood.category,
            description: newFood.notes,
            createdBy: auth.currentUser.uid,
            createdByName: auth.currentUser.displayName || 'Anonymous User',
            usageCount: 0,
            likes: 0,
            isRecipe: isRecipe,
            ingredients: isRecipe ? newFood.ingredients : [],
            instructions: isRecipe ? newFood.instructions : '',
            createdAt: serverTimestamp()
          };
          
          // Add to shared foods collection
          await addDoc(collection(db, "sharedFoods"), sharedFood);
          console.log("Food added to shared collection");
        } catch (shareError) {
          console.error("Error sharing food:", shareError);
          // Don't fail the whole operation if sharing fails
        }
      }
      
      // Clear form after successful submit
      setFormData({
        itemName: '',
        servingSize: '100',
        servingUnit: 'g',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        category: '',
        notes: '',
        instructions: isRecipe ? '' : undefined,
        totalServings: isRecipe ? 1 : undefined,
        ingredients: isRecipe ? [] : undefined,
        addToDiary: false,
        isPublic: alwaysPublic // Keep this set to alwaysPublic value
      });
      
      // Reset ingredient form
      setIngredient({
        name: '',
        amount: '',
        unit: 'g'
      });
      
      // Call success callback with the new food data and addToDiary preference
      if (onSuccess) {
        onSuccess(newFoodWithId, formData.addToDiary);
      }
    } catch (err) {
      console.error("Error adding food:", err);
      setError("Failed to add food. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle adding an ingredient to the recipe
  const handleAddIngredient = () => {
    if (!ingredient.name || !ingredient.amount) {
      setError("Ingredient name and amount are required");
      return;
    }

    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit
        }
      ]
    }));

    // Reset ingredient form
    setIngredient({
      name: '',
      amount: '',
      unit: 'g'
    });
  };
  
  // Handle removing an ingredient from the recipe
  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 bg-opacity-50 text-red-200' : 'bg-red-50 text-red-700'} mb-4 flex items-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      <div className="space-y-5">
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isRecipe ? 'Recipe Name' : 'Food Name'}
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border-0 ${
              isDarkMode 
                ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
            } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
            placeholder={isRecipe ? "My Homemade Recipe" : "Food name"}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Serving Size
            </label>
            <div className="flex mt-1">
              <input
                type="number"
                name="servingSize"
                value={formData.servingSize}
                onChange={handleChange}
                className={`block w-2/3 rounded-l-lg border-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                    : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
                placeholder="100"
              />
              <select
                name="servingUnit"
                value={formData.servingUnit}
                onChange={handleChange}
                className={`block w-1/3 rounded-r-lg border-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                    : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="oz">oz</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
                <option value="serving">serving</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Calories
            </label>
            <input
              type="number"
              name="calories"
              value={formData.calories}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-lg border-0 ${
                isDarkMode 
                  ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                  : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
              } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
              placeholder="0"
              required
            />
          </div>
        </div>
        
        <div className={`grid grid-cols-3 gap-5 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Protein (g)
            </label>
            <input
              type="number"
              name="protein"
              value={formData.protein}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-lg border-0 ${
                isDarkMode 
                  ? 'bg-gray-800 text-white ring-gray-600 focus:ring-indigo-500' 
                  : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
              } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Carbs (g)
            </label>
            <input
              type="number"
              name="carbs"
              value={formData.carbs}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-lg border-0 ${
                isDarkMode 
                  ? 'bg-gray-800 text-white ring-gray-600 focus:ring-indigo-500' 
                  : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
              } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Fat (g)
            </label>
            <input
              type="number"
              name="fat"
              value={formData.fat}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-lg border-0 ${
                isDarkMode 
                  ? 'bg-gray-800 text-white ring-gray-600 focus:ring-indigo-500' 
                  : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
              } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
              placeholder="0"
            />
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border-0 ${
              isDarkMode 
                ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
            } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
          >
            <option value="">Select a category</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
            <option value="Beverages">Beverages</option>
            <option value="Baked Goods">Baked Goods</option>
            <option value="Fruits">Fruits</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Proteins">Proteins</option>
            <option value="Dairy">Dairy</option>
            <option value="Grains">Grains</option>
            <option value="Desserts">Desserts</option>
            <option value="Uncategorized">Uncategorized</option>
          </select>
        </div>
        
        {isRecipe && (
          <>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Total Servings
              </label>
              <input
                type="number"
                name="totalServings"
                value={formData.totalServings}
                onChange={handleChange}
                min="1"
                className={`mt-1 block w-full rounded-lg border-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                    : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
                placeholder="1"
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Number of servings this recipe makes
              </p>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Cooking Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="3"
                className={`mt-1 block w-full rounded-lg border-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                    : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
                placeholder="Step by step cooking instructions..."
              ></textarea>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Ingredients
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => setIngredient({...ingredient, name: e.target.value})}
                  className={`flex-grow min-w-[40%] rounded-lg border-0 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white ring-gray-600 focus:ring-indigo-500' 
                      : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                  } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
                  placeholder="Ingredient name"
                />
                <input
                  type="number"
                  value={ingredient.amount}
                  onChange={(e) => setIngredient({...ingredient, amount: e.target.value})}
                  className={`w-24 rounded-lg border-0 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white ring-gray-600 focus:ring-indigo-500' 
                      : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                  } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
                  placeholder="Amount"
                />
                <select
                  value={ingredient.unit}
                  onChange={(e) => setIngredient({...ingredient, unit: e.target.value})}
                  className={`w-24 rounded-lg border-0 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white ring-gray-600 focus:ring-indigo-500' 
                      : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
                  } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                  <option value="piece">piece</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } shadow-sm`}
                >
                  Add
                </button>
              </div>
              
              {formData.ingredients && formData.ingredients.length > 0 ? (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <ul className="space-y-2">
                    {formData.ingredients.map((ing, index) => (
                      <li key={index} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-700">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {ing.name} ({ing.amount} {ing.unit})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className={`text-sm px-2 py-1 rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'bg-red-900 hover:bg-red-800 text-white' 
                              : 'bg-red-100 hover:bg-red-200 text-red-800'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No ingredients added yet
                </p>
              )}
            </div>
          </>
        )}
        
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className={`mt-1 block w-full rounded-lg border-0 ${
              isDarkMode 
                ? 'bg-gray-700 text-white ring-gray-600 focus:ring-indigo-500' 
                : 'bg-white text-gray-900 ring-gray-300 focus:ring-indigo-500'
            } shadow-sm ring-1 ring-inset px-3 py-2 focus:ring-2 transition-colors`}
            placeholder="Any additional notes about this food..."
          ></textarea>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} space-y-3`}>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="addToDiary"
              name="addToDiary"
              checked={formData.addToDiary}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="addToDiary" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Add to today's diary after saving
            </label>
          </div>
          
          {!alwaysPublic && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPublic" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Share with community (make public)
              </label>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full flex justify-center items-center py-3 px-4 border-0 rounded-lg text-sm font-medium text-white ${
            submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
          } shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-12`}
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {`Save ${isRecipe ? 'Recipe' : 'Food'}`}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddCustomFoodForm; 
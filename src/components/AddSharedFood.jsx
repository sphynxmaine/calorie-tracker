import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addSharedFood, getAllCategories } from '../data/foodDatabaseService';
import { useTheme } from '../context/ThemeContext';
import { useUpdate } from '../context/UpdateContext';

const AddSharedFood = ({ onSuccess }) => {
  const { isDarkMode } = useTheme();
  const { addPendingUpdate, isOnline } = useUpdate();
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    weight: '100g',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    fiber: '',
    sugar: '',
    sodium: '',
    description: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (err) {
        setError(`Failed to load categories: ${err.message}`);
      }
    };
    
    loadCategories();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle category change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === 'new') {
      setShowNewCategoryInput(true);
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    } else {
      setShowNewCategoryInput(false);
      setFormData(prev => ({
        ...prev,
        category: value
      }));
    }
  };
  
  // Handle new category input
  const handleNewCategoryChange = (e) => {
    setNewCategory(e.target.value);
    setFormData(prev => ({
      ...prev,
      category: e.target.value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Validate required fields
    if (!formData.itemName.trim()) {
      setError('Food name is required');
      setLoading(false);
      return;
    }
    
    if (!formData.category.trim()) {
      setError('Category is required');
      setLoading(false);
      return;
    }
    
    try {
      // Use the UpdateContext for real-time updates
      addPendingUpdate(
        'ADD_SHARED_FOOD',
        formData,
        (result) => {
          // Success
          setSuccess(true);
          setLoading(false);
          
          // Reset form
          setFormData({
            itemName: '',
            category: '',
            weight: '100g',
            calories: '',
            protein: '',
            fat: '',
            carbs: '',
            fiber: '',
            sugar: '',
            sodium: '',
            description: ''
          });
          
          // Notify parent component
          if (onSuccess) {
            onSuccess(result.data);
          }
          
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        },
        (error) => {
          // Error handling
          setError(error.message || 'Failed to add food');
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err.message || 'Failed to add food');
      setLoading(false);
    }
  };
  
  // Form styling
  const inputClasses = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? 'bg-dark-bg-secondary text-dark-text-primary border-dark-border focus:border-blue-500'
      : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
  } focus:outline-none transition-colors duration-200`;
  
  const labelClasses = `block mb-1 font-medium ${
    isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
  }`;
  
  return (
    <div className={`p-4 rounded-lg shadow-md ${
      isDarkMode ? 'bg-dark-bg-secondary' : 'bg-white'
    } transition-colors duration-200`}>
      <h2 className={`text-2xl font-bold mb-4 ${
        isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
      }`}>
        Add to Community Database
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-lg">
          Food added successfully to the community database!
        </div>
      )}
      
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-lg">
          You are offline. The food will be added when you reconnect.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="itemName" 
            className={labelClasses}
          >
            Food Name *
          </label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g. Apple"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label 
              htmlFor="category" 
              className={labelClasses}
            >
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category || (showNewCategoryInput ? 'new' : '')}
              onChange={handleCategoryChange}
              className={inputClasses}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value="new">+ Add New Category</option>
            </select>
          </div>
          
          {showNewCategoryInput && (
            <div>
              <label 
                htmlFor="newCategory" 
                className={labelClasses}
              >
                New Category *
              </label>
              <input
                type="text"
                id="newCategory"
                value={newCategory}
                onChange={handleNewCategoryChange}
                className={inputClasses}
                placeholder="e.g. Fruits"
                required
              />
            </div>
          )}
          
          <div>
            <label 
              htmlFor="weight" 
              className={labelClasses}
            >
              Serving Size
            </label>
            <input
              type="text"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 100g"
            />
          </div>
          
          <div>
            <label 
              htmlFor="calories" 
              className={labelClasses}
            >
              Calories (kcal)
            </label>
            <input
              type="number"
              id="calories"
              name="calories"
              value={formData.calories}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 150"
              min="0"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label 
              htmlFor="protein" 
              className={labelClasses}
            >
              Protein (g)
            </label>
            <input
              type="number"
              id="protein"
              name="protein"
              value={formData.protein}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 5"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label 
              htmlFor="carbs" 
              className={labelClasses}
            >
              Carbs (g)
            </label>
            <input
              type="number"
              id="carbs"
              name="carbs"
              value={formData.carbs}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 20"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label 
              htmlFor="fat" 
              className={labelClasses}
            >
              Fat (g)
            </label>
            <input
              type="number"
              id="fat"
              name="fat"
              value={formData.fat}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 2"
              min="0"
              step="0.1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label 
              htmlFor="fiber" 
              className={labelClasses}
            >
              Fiber (g)
            </label>
            <input
              type="number"
              id="fiber"
              name="fiber"
              value={formData.fiber}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 3"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label 
              htmlFor="sugar" 
              className={labelClasses}
            >
              Sugar (g)
            </label>
            <input
              type="number"
              id="sugar"
              name="sugar"
              value={formData.sugar}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 12"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label 
              htmlFor="sodium" 
              className={labelClasses}
            >
              Sodium (mg)
            </label>
            <input
              type="number"
              id="sodium"
              name="sodium"
              value={formData.sodium}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 50"
              min="0"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="description" 
            className={labelClasses}
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`${inputClasses} h-24 resize-none`}
            placeholder="Additional details about this food..."
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors duration-200 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Submitting...
              </div>
            ) : (
              'Add to Community'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Add PropTypes validation
AddSharedFood.propTypes = {
  onSuccess: PropTypes.func
};

export default AddSharedFood; 
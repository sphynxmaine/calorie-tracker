/**
 * Utility functions for the CalorieTracker application
 */

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format a date to YYYY-MM-DD format
 * @param {Date} date - The date to format
 * @returns {string} - The formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format a date to a more readable format (e.g., Jan 1, 2023)
 * @param {Date|string} date - The date to format
 * @returns {string} - The formatted date string
 */
export const formatDisplayDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get the current date at midnight in local time
 * @returns {Date} - Today's date at midnight
 */
export const getTodayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Generate a unique ID
 * @returns {string} - A unique ID
 */
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
 * @param {Object} userData - User data with weight, height, age, and gender
 * @returns {number} - The calculated BMR
 */
export const calculateBMR = (userData) => {
  const { weight, height, age, gender } = userData;
  
  if (!weight || !height || !age) return 0;
  
  // Convert height to cm if stored in inches
  const heightInCm = height > 3 ? height : height * 2.54;
  
  // Convert weight to kg if stored in lbs
  const weightInKg = weight > 150 ? weight / 2.205 : weight;
  
  if (gender === 'female') {
    return 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
  } else {
    return 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
  }
};

/**
 * Calculate calorie needs based on BMR and activity level
 * @param {number} bmr - The base BMR
 * @param {string} activityLevel - The activity level
 * @returns {number} - Daily calorie needs
 */
export const calculateCalorieNeeds = (bmr, activityLevel) => {
  if (!bmr) return 0;
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in m
 * @returns {number} - The calculated BMI
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  
  // Convert height to meters if stored in cm
  const heightInM = height > 3 ? height / 100 : height;
  
  return weight / (heightInM * heightInM);
};

/**
 * Get BMI category
 * @param {number} bmi - The BMI value
 * @returns {string} - The BMI category
 */
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Truncate a string to a specified length and add ellipsis
 * @param {string} str - The string to truncate
 * @param {number} length - The maximum length
 * @returns {string} - The truncated string
 */
export const truncateString = (str, length = 30) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Format a number with commas
 * @param {number} num - The number to format
 * @returns {string} - The formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Capitalize the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Check if a value is a valid number
 * @param {any} value - The value to check
 * @returns {boolean} - Whether the value is a valid number
 */
export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Convert a string to a number, returning 0 if invalid
 * @param {string} value - The string to convert
 * @returns {number} - The converted number
 */
export const parseNumberOrZero = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}; 
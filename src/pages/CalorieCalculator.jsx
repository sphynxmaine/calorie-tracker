import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const CalorieCalculator = () => {
  const { isDarkMode } = useTheme();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('maintain');
  const [bodyFat, setBodyFat] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('mifflin');
  const [calculatedResults, setCalculatedResults] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showZigzag, setShowZigzag] = useState(false);

  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 times/week
    moderate: 1.55, // Moderate exercise 3-5 times/week
    active: 1.725, // Heavy exercise 6-7 times/week
    veryActive: 1.9 // Very heavy exercise, physical job or training twice per day
  };

  const goalMultipliers = {
    lose_extreme: 0.75, // Extreme weight loss (1 kg/week)
    lose_moderate: 0.85, // Moderate weight loss (0.5 kg/week)
    lose_light: 0.9, // Light weight loss (0.25 kg/week)
    maintain: 1.0, // Maintain weight
    gain: 1.1 // Gain weight
  };

  const calculateCalories = () => {
    if (!height || !weight || !age) {
      alert('Please fill in all required fields');
      return;
    }

    if (calculationMethod === 'katch' && !bodyFat) {
      alert('Body fat percentage is required for the Katch-McArdle Formula');
      return;
    }

    // Parse inputs
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);
    const bf = bodyFat ? parseFloat(bodyFat) / 100 : 0;

    // Calculate BMR using selected method
    let bmr = 0;

    switch (calculationMethod) {
      case 'mifflin':
        // Mifflin-St Jeor Equation
        if (gender === 'male') {
          bmr = 10 * w + 6.25 * h - 5 * a + 5;
        } else {
          bmr = 10 * w + 6.25 * h - 5 * a - 161;
        }
        break;
      case 'harris':
        // Revised Harris-Benedict Equation
        if (gender === 'male') {
          bmr = 13.397 * w + 4.799 * h - 5.677 * a + 88.362;
        } else {
          bmr = 9.247 * w + 3.098 * h - 4.330 * a + 447.593;
        }
        break;
      case 'katch':
        // Katch-McArdle Formula (needs body fat %)
        const leanMass = w * (1 - bf);
        bmr = 370 + (21.6 * leanMass);
        break;
      default:
        // Default to Mifflin-St Jeor
        if (gender === 'male') {
          bmr = 10 * w + 6.25 * h - 5 * a + 5;
        } else {
          bmr = 10 * w + 6.25 * h - 5 * a - 161;
        }
    }

    // Adjust for activity level
    const tdee = bmr * activityMultipliers[activityLevel];
    
    // Adjust for weight goal
    const dailyCalories = Math.round(tdee * goalMultipliers[goal]);
    
    // Calculate values for different weight goals
    const results = {
      bmr: Math.round(bmr),
      maintain: Math.round(tdee),
      mildLoss: Math.round(tdee * 0.9),
      weightLoss: Math.round(tdee * 0.85),
      extremeLoss: Math.round(tdee * 0.75),
      gain: Math.round(tdee * 1.1),
      selectedGoal: dailyCalories,
      method: calculationMethod
    };

    // Calculate zigzag schedule
    const zigzag1 = calculateZigzag1(results.selectedGoal);
    const zigzag2 = calculateZigzag2(results.selectedGoal);

    results.zigzag1 = zigzag1;
    results.zigzag2 = zigzag2;

    setCalculatedResults(results);
  };

  // First zigzag schedule (high-low-high pattern)
  const calculateZigzag1 = (dailyCalories) => {
    const weeklyCalories = dailyCalories * 7;
    const highDay = Math.round(dailyCalories * 1.1); // 10% more calories
    const lowDay = Math.round((weeklyCalories - (highDay * 2)) / 5); // Remaining calories spread across 5 days
    
    return {
      sunday: highDay,
      monday: lowDay,
      tuesday: lowDay,
      wednesday: lowDay,
      thursday: lowDay,
      friday: lowDay,
      saturday: highDay
    };
  };

  // Second zigzag schedule (gradual increase/decrease)
  const calculateZigzag2 = (dailyCalories) => {
    const weeklyCalories = dailyCalories * 7;
    const sunday = Math.round(dailyCalories * 0.95);
    const monday = Math.round(dailyCalories * 1.05);
    const tuesday = Math.round(dailyCalories * 1.1);
    const wednesday = Math.round(dailyCalories * 1.15);
    const thursday = Math.round(dailyCalories * 0.9);
    const friday = Math.round(dailyCalories * 0.85);
    const saturday = Math.round(weeklyCalories - sunday - monday - tuesday - wednesday - thursday - friday);
    
    return {
      sunday,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday
    };
  };

  const saveToProfile = async () => {
    if (!calculatedResults) return;

    try {
      const userId = auth.currentUser.uid;
      await setDoc(doc(db, 'userProfiles', userId), {
        height,
        weight,
        age,
        gender,
        activityLevel,
        goal,
        bodyFat: bodyFat || null,
        calculationMethod,
        bmr: calculatedResults.bmr,
        settings: {
          dailyCalorieGoal: calculatedResults.selectedGoal,
          dailyProteinGoal: Math.round(calculatedResults.selectedGoal * 0.3 / 4), // 30% protein
          dailyCarbsGoal: Math.round(calculatedResults.selectedGoal * 0.4 / 4), // 40% carbs
          dailyFatGoal: Math.round(calculatedResults.selectedGoal * 0.3 / 9)  // 30% fat
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert('Calorie goal saved to your profile!');
    } catch (error) {
      console.error('Error saving to profile:', error);
      alert('Failed to save to profile. Please try again.');
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-xl shadow-lg transition-all duration-300 ${
      isDarkMode 
        ? 'bg-dark-bg-secondary text-dark-text-primary' 
        : 'bg-white text-gray-900'
    }`}>
      <div className={`border-b pb-4 mb-6 ${isDarkMode ? 'border-dark-border' : 'border-gray-200'}`}>
        <h1 className={`text-2xl font-bold text-center ${
          isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
        }`}>
          Calorie Calculator
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-dark-text-primary' : 'text-gray-800'
          }`}>
            Enter Your Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}>
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                placeholder="e.g., 175"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}>
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                placeholder="e.g., 70"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}>
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                placeholder="e.g., 30"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}>
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Lightly active (exercise 1-3 days/week)</option>
                <option value="moderate">Moderately active (exercise 3-5 days/week)</option>
                <option value="active">Very active (exercise 6-7 days/week)</option>
                <option value="veryActive">Extra active (hard exercise & physical job)</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
              }`}>
                Weight Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              >
                <option value="maintain">Maintain weight</option>
                <option value="lose_light">Mild weight loss (0.25 kg/week)</option>
                <option value="lose_moderate">Weight loss (0.5 kg/week)</option>
                <option value="lose_extreme">Extreme weight loss (1 kg/week)</option>
                <option value="gain">Weight gain</option>
              </select>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`text-sm font-medium ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                } transition-colors duration-200`}
              >
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
                    }`}>
                      Body Fat % (optional)
                    </label>
                    <input
                      type="number"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                      placeholder="e.g., 20"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
                    }`}>
                      Calculation Method
                    </label>
                    <select
                      value={calculationMethod}
                      onChange={(e) => setCalculationMethod(e.target.value)}
                      className={`w-full p-2 rounded-lg transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-dark-bg-tertiary border-dark-border text-dark-text-primary focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                    >
                      <option value="mifflin">Mifflin-St Jeor (default)</option>
                      <option value="harris">Revised Harris-Benedict</option>
                      <option value="katch">Katch-McArdle (requires body fat %)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={calculateCalories}
              className={`w-full py-3 mt-4 font-semibold rounded-xl shadow-md transform transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20 hover:shadow-lg hover:-translate-y-0.5' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-300/20 hover:shadow-lg hover:-translate-y-0.5'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]`}
            >
              Calculate
            </button>
          </div>
        </div>
        
        <div>
          <h2 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-dark-text-primary' : 'text-gray-800'
          }`}>
            Results
          </h2>
          
          {!calculatedResults ? (
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-dark-bg-tertiary text-dark-text-secondary' : 'bg-gray-100 text-gray-600'
            }`}>
              <p>The results show a number of daily calorie estimate that can be used as a guideline for how many calories to consume each day to maintain, lose, or gain weight at a chosen rate.</p>
              <p className="mt-4">Fill in your details and click Calculate to see results.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-dark-bg-tertiary' : 'bg-blue-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-800'
                }`}>
                  Your Daily Calorie Needs
                </h3>
                <p className={`mb-1 ${
                  isDarkMode ? 'text-dark-text-secondary' : 'text-gray-700'
                }`}>
                  Based on {
                    calculationMethod === 'mifflin' 
                      ? 'Mifflin-St Jeor Equation' 
                      : calculationMethod === 'harris' 
                        ? 'Revised Harris-Benedict Equation' 
                        : 'Katch-McArdle Formula'
                  }
                </p>
                
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-dark-bg-primary' : 'bg-white'
                  } shadow-sm`}>
                    <span className={`block text-sm ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      Basal Metabolic Rate
                    </span>
                    <span className={`block text-xl font-bold ${
                      isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
                    }`}>
                      {calculatedResults.bmr}
                    </span>
                    <span className={`block text-xs ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      calories/day
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-dark-bg-primary bg-opacity-80' : 'bg-white bg-opacity-80'
                  } shadow-sm`}>
                    <span className={`block text-sm ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      Maintain Weight
                    </span>
                    <span className={`block text-xl font-bold ${
                      isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
                    }`}>
                      {calculatedResults.maintain}
                    </span>
                    <span className={`block text-xs ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      calories/day
                    </span>
                  </div>
                </div>
                
                <div className={`mt-4 p-4 rounded-lg ${
                  isDarkMode 
                    ? 'bg-blue-900 bg-opacity-30 border border-blue-700' 
                    : 'bg-blue-100 border border-blue-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      {goal === 'maintain' 
                        ? 'Maintain Weight'
                        : goal === 'lose_light' 
                          ? 'Mild Weight Loss'
                          : goal === 'lose_moderate' 
                            ? 'Weight Loss'
                            : goal === 'lose_extreme' 
                              ? 'Extreme Weight Loss'
                              : 'Weight Gain'
                      }
                    </span>
                    <span className={`text-xl font-bold ${
                      isDarkMode ? 'text-blue-100' : 'text-blue-900'
                    }`}>
                      {calculatedResults.selectedGoal}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      calories/day
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  <div className={`p-2 rounded ${
                    isDarkMode ? 'bg-dark-bg-primary bg-opacity-60' : 'bg-white bg-opacity-60'
                  }`}>
                    <span className={`text-sm block ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      Mild Weight Loss
                    </span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
                    }`}>
                      {calculatedResults.mildLoss} cal
                    </span>
                  </div>
                  
                  <div className={`p-2 rounded ${
                    isDarkMode ? 'bg-dark-bg-primary bg-opacity-60' : 'bg-white bg-opacity-60'
                  }`}>
                    <span className={`text-sm block ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      Weight Loss
                    </span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
                    }`}>
                      {calculatedResults.weightLoss} cal
                    </span>
                  </div>
                  
                  <div className={`p-2 rounded ${
                    isDarkMode ? 'bg-dark-bg-primary bg-opacity-60' : 'bg-white bg-opacity-60'
                  }`}>
                    <span className={`text-sm block ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      Extreme Weight Loss
                    </span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
                    }`}>
                      {calculatedResults.extremeLoss} cal
                    </span>
                  </div>
                  
                  <div className={`p-2 rounded ${
                    isDarkMode ? 'bg-dark-bg-primary bg-opacity-60' : 'bg-white bg-opacity-60'
                  }`}>
                    <span className={`text-sm block ${
                      isDarkMode ? 'text-dark-text-muted' : 'text-gray-500'
                    }`}>
                      Weight Gain
                    </span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-dark-text-primary' : 'text-gray-900'
                    }`}>
                      {calculatedResults.gain} cal
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={saveToProfile}
                  className={`flex-1 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]`}
                >
                  Save to Profile
                </button>
                
                <button
                  onClick={() => setShowZigzag(!showZigzag)}
                  className={`flex-1 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-dark-bg-tertiary hover:bg-dark-bg-primary text-dark-text-primary border border-dark-border'
                      : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]`}
                >
                  {showZigzag ? 'Hide Zigzag Plan' : 'Show Zigzag Plan'}
                </button>
              </div>
              
              {showZigzag && (
                <div className={`mt-4 p-4 rounded-lg ${
                  isDarkMode ? 'bg-dark-bg-tertiary' : 'bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-dark-text-primary' : 'text-gray-800'
                  }`}>
                    Zigzag Calorie Cycling
                  </h3>
                  <p className={`text-sm mb-4 ${
                    isDarkMode ? 'text-dark-text-secondary' : 'text-gray-600'
                  }`}>
                    Alternating calorie intake can help overcome plateaus and make diet adherence easier.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className={`font-medium mb-2 ${
                        isDarkMode ? 'text-dark-text-primary' : 'text-gray-800'
                      }`}>
                        Pattern 1: Weekend Higher
                      </h4>
                      <div className={`grid grid-cols-7 gap-1 text-center ${
                        isDarkMode ? 'text-dark-text-secondary' : 'text-gray-600'
                      }`}>
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-blue-800 bg-opacity-30 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {calculatedResults.zigzag1.sunday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag1.monday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag1.tuesday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag1.wednesday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag1.thursday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag1.friday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-blue-800 bg-opacity-30 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {calculatedResults.zigzag1.saturday}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className={`font-medium mb-2 ${
                        isDarkMode ? 'text-dark-text-primary' : 'text-gray-800'
                      }`}>
                        Pattern 2: Midweek Higher
                      </h4>
                      <div className={`grid grid-cols-7 gap-1 text-center ${
                        isDarkMode ? 'text-dark-text-secondary' : 'text-gray-600'
                      }`}>
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag2.sunday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag2.monday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-blue-800 bg-opacity-30 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {calculatedResults.zigzag2.tuesday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-blue-800 bg-opacity-40 text-blue-200' : 'bg-blue-200 text-blue-800'
                        }`}>
                          {calculatedResults.zigzag2.wednesday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag2.thursday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag2.friday}
                        </div>
                        <div className={`p-2 rounded ${
                          isDarkMode ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-gray-800'
                        }`}>
                          {calculatedResults.zigzag2.saturday}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalorieCalculator; 
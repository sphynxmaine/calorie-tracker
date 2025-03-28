// src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';

const Profile = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    activityLevel: 'sedentary',
    goal: 'maintain',
    bodyFat: '',
    calculationMethod: 'mifflin',
    bmr: null,
    dailyCalories: null
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 times/week
    moderate: 1.55, // Moderate exercise 3-5 times/week
    active: 1.725, // Heavy exercise 6-7 times/week
    veryActive: 1.9 // Very heavy exercise, physical job or training twice per day
  };

  // Weight goal multipliers
  const goalMultipliers = {
    lose_extreme: 0.75, // Extreme weight loss (1 kg/week)
    lose_moderate: 0.85, // Moderate weight loss (0.5 kg/week)
    lose_light: 0.9, // Light weight loss (0.25 kg/week)
    maintain: 1.0, // Maintain weight
    gain: 1.1 // Gain weight
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser.uid;
      const docRef = doc(db, 'userProfiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data();
        console.log("Loaded profile data:", profileData);
        
        // Create a normalized profile object with all expected fields
        const normalizedProfile = {
          height: profileData.height || '',
          weight: profileData.weight || '',
          age: profileData.age || '',
          gender: profileData.gender || 'male',
          activityLevel: profileData.activityLevel || 'sedentary',
          goal: profileData.goal || 'maintain',
          bodyFat: profileData.bodyFat || '',
          calculationMethod: profileData.calculationMethod || 'mifflin',
          bmr: profileData.bmr || null,
          dailyCalories: profileData.dailyCalories || 
                        (profileData.settings?.dailyCalorieGoal) || null,
          tdee: profileData.tdee || null
        };
        
        // Update the profile state
        setProfile(normalizedProfile);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading profile:", error);
      setLoading(false);
    }
  };

  const calculateBMR = () => {
    // Check required fields
    const weight = parseFloat(profile.weight);
    const height = parseFloat(profile.height);
    const age = parseFloat(profile.age);
    const bodyFat = profile.bodyFat ? parseFloat(profile.bodyFat) : null;

    if (isNaN(weight) || isNaN(height) || isNaN(age)) {
      setMessage('Please enter valid numbers for height, weight, and age');
      return null;
    }

    if (profile.calculationMethod === 'katch' && (isNaN(bodyFat) || bodyFat === null)) {
      setMessage('Body fat percentage is required for Katch-McArdle Formula');
      return null;
    }

    // Calculate BMR using selected method
    let bmr = 0;

    switch (profile.calculationMethod) {
      case 'mifflin':
        // Mifflin-St Jeor Equation
        if (profile.gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        break;
      case 'harris':
        // Revised Harris-Benedict Equation
        if (profile.gender === 'male') {
          bmr = 13.397 * weight + 4.799 * height - 5.677 * age + 88.362;
        } else {
          bmr = 9.247 * weight + 3.098 * height - 4.330 * age + 447.593;
        }
        break;
      case 'katch':
        // Katch-McArdle Formula (needs body fat %)
        const bf = bodyFat / 100;
        const leanMass = weight * (1 - bf);
        bmr = 370 + (21.6 * leanMass);
        break;
      default:
        // Default to Mifflin-St Jeor
        if (profile.gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
    }

    // Calculate daily calories based on activity level and goal
    const tdee = bmr * activityMultipliers[profile.activityLevel];
    const dailyCalories = Math.round(tdee * goalMultipliers[profile.goal]);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      dailyCalories
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const results = calculateBMR();
      if (!results) {
        setLoading(false);
        return; // Error in calculation
      }
      
      const { bmr, tdee, dailyCalories } = results;

      const userId = auth.currentUser.uid;
      
      // Create a well-structured profile object with all needed fields
      const profileData = {
        ...profile,
        bmr,
        tdee,
        dailyCalories,
        // Add settings field for compatibility with other parts of the app
        settings: {
          dailyCalorieGoal: dailyCalories,
          dailyProteinGoal: Math.round(dailyCalories * 0.3 / 4), // 30% of calories from protein (4 cal/g)
          dailyCarbsGoal: Math.round(dailyCalories * 0.4 / 4),   // 40% of calories from carbs (4 cal/g)
          dailyFatGoal: Math.round(dailyCalories * 0.3 / 9),     // 30% of calories from fat (9 cal/g)
        },
        updatedAt: new Date().toISOString()
      };
      
      // Use merge: true to avoid overwriting other fields
      await setDoc(doc(db, 'userProfiles', userId), profileData, { merge: true });

      // Update local state
      setProfile(prev => ({
        ...prev,
        ...profileData
      }));

      setMessage('Profile updated successfully!');
      
      // Show the success message for 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderAppearanceSettings = () => (
    <div className={`mt-6 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>App Settings</h2>
      
      <div className="flex items-center justify-between">
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Dark Mode</span>
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          type="button"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDarkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className={`max-w-2xl mx-auto p-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <PageHeader
        title="Profile Settings"
        rightText={auth.currentUser?.displayName || "User"}
        isProfilePage={true}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderAppearanceSettings()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Height (cm)</label>
            <input
              type="number"
              name="height"
              value={profile.height}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Height in centimeters"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={profile.weight}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Weight in kilograms"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Age</label>
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Your age"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gender</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Activity Level</label>
            <select
              name="activityLevel"
              value={profile.activityLevel}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Light (exercise 1-3 times/week)</option>
              <option value="moderate">Moderate (exercise 3-5 times/week)</option>
              <option value="active">Active (exercise 6-7 times/week)</option>
              <option value="veryActive">Very Active (hard exercise & physical job)</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Weight Goal</label>
            <select
              name="goal"
              value={profile.goal}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="maintain">Maintain weight</option>
              <option value="lose_light">Mild weight loss (0.25 kg/week)</option>
              <option value="lose_moderate">Weight loss (0.5 kg/week)</option>
              <option value="lose_extreme">Extreme weight loss (1 kg/week)</option>
              <option value="gain">Weight gain</option>
            </select>
          </div>
        </div>

        <div>
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`text-sm underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
          </button>

          {showAdvanced && (
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Advanced Calculation Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Body Fat Percentage</label>
                  <input
                    type="number"
                    name="bodyFat"
                    value={profile.bodyFat}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g. 20"
                    min="0"
                    max="100"
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Required for Katch-McArdle formula</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Calculation Method</label>
                  <select
                    name="calculationMethod"
                    value={profile.calculationMethod}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="mifflin">Mifflin-St Jeor Equation (recommended)</option>
                    <option value="harris">Revised Harris-Benedict Equation</option>
                    <option value="katch">Katch-McArdle Formula (requires body fat %)</option>
                  </select>
                </div>
              </div>

              <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="mb-1 font-medium">Calculation Methods:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Mifflin-St Jeor:</strong> Most accurate for general population</li>
                  <li><strong>Harris-Benedict:</strong> Revised in 1984, historically popular</li>
                  <li><strong>Katch-McArdle:</strong> Accounts for lean body mass, good for athletes</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('Error') 
              ? (isDarkMode ? 'bg-red-900 bg-opacity-50 text-red-200' : 'bg-red-100 text-red-700')
              : (isDarkMode ? 'bg-green-900 bg-opacity-50 text-green-200' : 'bg-green-100 text-green-700')
          }`}>
            {message}
          </div>
        )}

        {profile.bmr && (
          <div className={`mt-6 p-4 rounded-md ${
            isDarkMode ? 'bg-blue-900 bg-opacity-30 text-blue-200' : 'bg-blue-50 text-blue-900'
          }`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>Your Calculations</h2>
            <p className="mt-2">Base Metabolic Rate (BMR): <span className="font-semibold">{profile.bmr} calories/day</span></p>
            <p className="mt-1">Total Daily Energy Expenditure: <span className="font-semibold">{profile.tdee} calories/day</span></p>
            <p className="mt-1">Daily Calorie Need: <span className="font-semibold">{profile.dailyCalories} calories/day</span></p>
            <div className="mt-3 text-sm">
              <Link to="/calculator" className={`hover:underline ${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}>
                Advanced Calculator ↗
              </Link>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculate & Save Profile
        </button>
      </form>
    </div>
  );
};

export default Profile;

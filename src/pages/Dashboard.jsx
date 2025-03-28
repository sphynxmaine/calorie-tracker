import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthState, setAuthPersistence, signOutUser } from "../auth";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import "../index.css"; // Ensure Tailwind is applied
import PropTypes from 'prop-types'; // Add PropTypes import
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, ResponsiveContainer, LineChart, Line, Area } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import DarkModeToggle from '../components/DarkModeToggle';
import { limit } from "firebase/firestore";
import PageHeader from '../components/PageHeader';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import AddFoodModal from '../components/AddFoodModal';
import EditFoodModal from '../components/EditFoodModal';
import { toISODateString } from '../utils/dateUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Diary"); // Track the active tab
  const [userProfile, setUserProfile] = useState(null);
  const [profileUpdated, setProfileUpdated] = useState(false); // Track when profile is updated
  
  const { isDarkMode } = useTheme();
  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [calorieGoal, setCalorieGoal] = useState(1800);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit food state
  const [showEditFood, setShowEditFood] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState(null);

  // Check if user is logged in and set persistence
  useEffect(() => {
    setAuthPersistence().catch((error) => {
      console.error("Error setting persistence:", error);
    });

    const unsubscribe = onAuthState((user) => {
      if (user) {
        console.log("User authenticated:", user.uid);
        setUser(user);
        // Fetch user profile
        fetchUserProfile(user.uid);
      } else {
        console.log("No user authenticated, redirecting to login");
        setUser(null);
        navigate("/login"); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      console.log(`Fetching profile for user: ${userId}`);
      const docRef = doc(db, "userProfiles", userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        console.log("User profile loaded:", profileData);
        setUserProfile(profileData);
        
        // Set calorie goal from profile if available
        if (profileData.settings && profileData.settings.dailyCalorieGoal) {
          setCalorieGoal(profileData.settings.dailyCalorieGoal);
        } else if (profileData.dailyCalories) {
          setCalorieGoal(profileData.dailyCalories);
        }
        
        setProfileUpdated(prev => !prev); // Toggle this value to signal a profile update
      } else {
        console.log("No profile found for user, creating default profile");
        // Create a default profile if none exists
        const defaultProfile = {
          uid: userId,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || "User",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          settings: {
            dailyCalorieGoal: 2000,
            dailyProteinGoal: 150,
            dailyCarbsGoal: 200,
            dailyFatGoal: 65
          }
        };
        
        try {
          await setDoc(doc(db, "userProfiles", userId), defaultProfile);
          console.log("Default profile created");
          setUserProfile(defaultProfile);
          setCalorieGoal(defaultProfile.settings.dailyCalorieGoal);
          setProfileUpdated(prev => !prev);
        } catch (error) {
          console.error("Error creating default profile:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Fetch meals for the selected date whenever the date changes
  useEffect(() => {
    if (!user) return;
    
    const fetchMealsForDate = async () => {
      setIsLoading(true);
      const dateString = toISODateString(date);
      console.log("Fetching meals for date:", dateString);
      
      try {
        // Query meals for this user and date
        const q = query(
          collection(db, "foodEntries"),
          where("userId", "==", user.uid),
          where("date", "==", dateString)
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`Got ${snapshot.size} food entries for ${dateString}`);
          
          // Reset meal data
          const newMeals = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          };
          
          let totalCalories = 0;
          
          // Process each food entry
          snapshot.forEach(doc => {
            const entry = { id: doc.id, ...doc.data() };
            const mealType = entry.meal?.toLowerCase() || 'snacks';
            
            // Ensure we have the correct food name displayed
            entry.displayName = entry.foodName || entry.name || "Food";
            entry.displayAmount = entry.amount || entry.servings || 1;
            entry.displayText = `${entry.displayAmount} serving${entry.displayAmount !== 1 ? 's' : ''}`;
            
            // Add to appropriate meal category
            if (newMeals[mealType]) {
              newMeals[mealType].push(entry);
              totalCalories += Number(entry.calories || 0);
            }
          });
          
          // Update state with fetched data
          setMeals(newMeals);
          setConsumedCalories(totalCalories);
          setIsLoading(false);
        });
        
        // Clean up listener when component unmounts or date changes
        return () => {
          console.log("Cleaning up meal listener");
          unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching meals:", error);
        setIsLoading(false);
      }
    };
    
    fetchMealsForDate();
  }, [user, date]);

  // Improved date navigation with better visual feedback
  const handleDateChange = (direction) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + direction);
    setDate(newDate);
    
    // Show loading state when changing dates
    setIsLoading(true);
  };

  // Listen for add food events from MobileNavbar and other components
  useEffect(() => {
    const handleOpenAddFoodModal = (event) => {
      // Get the meal from the event detail or default to breakfast
      const mealName = event.detail?.meal || 'breakfast';
      setSelectedMeal(mealName);
      setShowAddFood(true);
    };

    // Listen for custom events
    window.addEventListener('openAddFoodModal', handleOpenAddFoodModal);

    // Cleanup listener
    return () => {
      window.removeEventListener('openAddFoodModal', handleOpenAddFoodModal);
    };
  }, []);

  // Handle adding food to the diary
  const handleAddFoodToMeal = (food, meal) => {
    // We don't need to update local state here anymore since we're using Firebase
    // and the onSnapshot listener will update the state automatically
    setShowAddFood(false);
  };

  // Handle editing food entry
  const handleEditFood = (food) => {
    setFoodToEdit(food);
    setSelectedMeal(food.meal);
    setShowEditFood(true);
  };

  // Function to handle updating food
  const handleUpdateFood = async (updatedFood) => {
    // Update local state immediately
    if (meals[selectedMeal]) {
      const newMeals = { ...meals };
      
      // If meal changed, need to remove from old meal and add to new meal
      if (updatedFood.meal !== foodToEdit.meal) {
        // Remove from old meal
        newMeals[foodToEdit.meal] = newMeals[foodToEdit.meal]?.filter(
          food => food.id !== updatedFood.id
        ) || [];
        
        // Add to new meal
        newMeals[updatedFood.meal] = [
          ...(newMeals[updatedFood.meal] || []),
          updatedFood
        ];
      } else {
        // Just update in current meal
        newMeals[updatedFood.meal] = newMeals[updatedFood.meal]?.map(
          food => food.id === updatedFood.id ? updatedFood : food
        ) || [];
      }
      
      setMeals(newMeals);
    }
    
    setShowEditFood(false);
    setFoodToEdit(null);
  };

  // Function to handle deleting food
  const handleDeleteFood = async (foodId) => {
    try {
      const foodRef = doc(db, "foodEntries", foodId);
      await deleteDoc(foodRef);
      
      // Update local state to remove the food immediately
      const newMeals = { ...meals };
      
      // Check all meal types to find and remove the food
      Object.keys(newMeals).forEach(mealType => {
        newMeals[mealType] = newMeals[mealType].filter(
          food => food.id !== foodId
        );
      });
      
      setMeals(newMeals);
      return true;
    } catch (error) {
      console.error('Error deleting food:', error);
      return false;
    }
  };

  // Find the handleAddFood function and update it to use selectedMeal
  const handleAddFood = (meal) => {
    setSelectedMeal(meal);
    setShowAddFood(true);
  };

  // Format date with a more consistent approach
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  // Enhanced MealSection component with improved visuals
  const MealSection = ({ title, foods = [], onAdd }) => {
    const mealType = title.toLowerCase();
    const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0);
    
    const mealIcons = {
      breakfast: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      lunch: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      dinner: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
      ),
      snacks: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    
    return (
      <div className={`mb-4 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex justify-between items-center p-4 border-b border-opacity-10">
          <div className="flex items-center">
            <span className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
              {mealIcons[mealType] || mealIcons.snacks}
            </span>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          </div>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
            {totalCalories} cal
          </div>
        </div>
        
        <div className="divide-y divide-opacity-10">
          {foods && foods.length > 0 ? (
            foods.map((item) => (
              <div 
                key={item.id} 
                className={`flex justify-between items-center p-4 ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                } cursor-pointer transition-colors duration-200`}
                onClick={() => handleEditFood(item)}
              >
                <div className="flex-1">
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.displayName}
                    {item.displayAmount > 1 ? ` (${item.displayAmount})` : ''}
                  </div>
                  <div className="flex mt-1 text-xs space-x-2">
                    <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                      {item.protein}g P
                    </span>
                    <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-green-300' : 'bg-green-100 text-green-800'}`}>
                      {item.carbs}g C
                    </span>
                    <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.fat}g F
                    </span>
                  </div>
                </div>
                <div className={`ml-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.calories} cal
                </div>
              </div>
            ))
          ) : (
            <div className={`p-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No food items
            </div>
          )}
          
          <div className="p-2">
            <button
              onClick={() => onAdd(mealType)}
              className={`w-full p-2 rounded-lg flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Food
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch user profile and calculate calorie needs
  useEffect(() => {
    const fetchUserProfileAndCalculateCalories = async () => {
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            
            // Get weight, height, age, gender, activity level from profile
            const { weight, height, age, gender, activityLevel } = profileData;
            
            // Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
            let bmr = 0;
            if (gender === 'male') {
              bmr = 10 * weight + 6.25 * height - 5 * age + 5;
            } else {
              bmr = 10 * weight + 6.25 * height - 5 * age - 161;
            }
            
            // Apply activity multiplier
            let activityMultiplier = 1.2; // sedentary
            switch (activityLevel) {
              case 'lightly-active':
                activityMultiplier = 1.375;
                break;
              case 'moderately-active':
                activityMultiplier = 1.55;
                break;
              case 'very-active':
                activityMultiplier = 1.725;
                break;
              case 'super-active':
                activityMultiplier = 1.9;
                break;
              default:
                activityMultiplier = 1.2;
            }
            
            // TDEE (Total Daily Energy Expenditure)
            const calorieNeeds = Math.round(bmr * activityMultiplier);
            
            // Get weight goal and adjust calories accordingly
            const { weightGoal } = profileData;
            let adjustedCalories = calorieNeeds;
            
            switch (weightGoal) {
              case 'lose':
                adjustedCalories = calorieNeeds - 500; // 500 calorie deficit
                break;
              case 'gain':
                adjustedCalories = calorieNeeds + 500; // 500 calorie surplus
                break;
              default:
                adjustedCalories = calorieNeeds; // maintain weight
            }
            
            // Set the calorie goal
            setCalorieGoal(adjustedCalories);
          }
        } catch (error) {
          console.error('Error fetching profile or calculating calories:', error);
        }
      }
    };
    
    fetchUserProfileAndCalculateCalories();
  }, [user, profileUpdated]);

  const loadMeals = async (selectedDate) => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('No user ID found');
        setIsLoading(false);
        return;
      }
      
      // Format date for Firestore query
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Get all food entries for the specified date
      const foodQuery = query(
        collection(db, "foodEntries"),
        where("userId", "==", userId),
        where("date", "==", dateStr)
      );
      
      const foodSnapshot = await getDocs(foodQuery);
      
      // Group entries by meal type
      const mealData = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      };
      
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      foodSnapshot.forEach((doc) => {
        // Get the food entry data and standardize it
        const rawEntry = { id: doc.id, ...doc.data() };
        const entry = standardizeFoodData(rawEntry);
        
        // Make sure the meal property exists and is one of our defined meal types
        const mealType = entry.meal && mealData.hasOwnProperty(entry.meal.toLowerCase()) 
          ? entry.meal.toLowerCase()
          : 'snacks'; // Default to snacks if meal type is invalid
        
        // Add entry to the appropriate meal group
        mealData[mealType].push(entry);
        
        // Add to daily totals
        totalCalories += Number(entry.calories || 0);
        totalProtein += Number(entry.protein || 0);
        totalCarbs += Number(entry.carbs || 0);
        totalFat += Number(entry.fat || 0);
      });
      
      // Set state with all meal data and totals
      setMeals(mealData);
      setConsumedCalories(totalCalories);
      setDailyNutrition({
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat)
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading meals:', error);
      setIsLoading(false);
    }
  };

  const FoodItem = ({ item, onDelete }) => {
    return (
      <div className={`p-4 flex justify-between items-center ${
        isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
      }`}>
        <div>
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {item.displayName}
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.displayText} · {item.calories} cal
          </div>
        </div>
        
        <button
          onClick={() => onDelete(item.id)}
          className={`p-2 rounded-full ${
            isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <PageHeader
        title="Dashboard"
        showBackButton={false}
      />
      
      {/* Enhanced Date Selector */}
      <div className={`px-4 py-3 flex items-center justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-4`}>
        <button 
          onClick={() => handleDateChange(-1)}
          className={`p-2 rounded-full ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'} transition-colors duration-200`}
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className={`text-center font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {isToday(date) ? 'Today' : formatDate(date)}
        </div>
        
        <button 
          onClick={() => handleDateChange(1)}
          className={`p-2 rounded-full ${
            isToday(date) 
              ? `${isDarkMode ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed` 
              : `${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'} transition-colors duration-200`
          }`}
          disabled={isToday(date)}
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Progress Ring */}
          <div className="p-4 flex justify-center">
            <div className="w-36 h-36">
              <CircularProgressbar
                value={(consumedCalories / calorieGoal) * 100}
                text={`${Math.round((consumedCalories / calorieGoal) * 100)}%`}
                styles={buildStyles({
                  textSize: '16px',
                  pathColor: isDarkMode ? '#3B82F6' : '#2563EB',
                  textColor: isDarkMode ? '#FFFFFF' : '#111827',
                  trailColor: isDarkMode ? '#374151' : '#E5E7EB',
                  pathTransition: 'stroke-dashoffset 0.5s ease 0s',
                })}
              />
            </div>
          </div>
          
          {/* Enhanced Calorie Summary */}
          <div className="px-4 mb-6 flex justify-between text-center">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex-1 mx-1`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>GOAL</div>
              <div className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{calorieGoal} Cal</div>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex-1 mx-1`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>CONSUMED</div>
              <div className="font-medium text-lg text-green-500">{consumedCalories} Cal</div>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex-1 mx-1`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>REMAINING</div>
              <div className={`font-medium text-lg ${
                calorieGoal - consumedCalories < 0 
                  ? 'text-red-500' 
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{calorieGoal - consumedCalories} Cal</div>
            </div>
          </div>

          {/* Meal Sections */}
          <div className="px-4 pb-24">
            <MealSection
              title="Breakfast"
              foods={meals.breakfast}
              onAdd={handleAddFood}
            />
            <MealSection
              title="Lunch"
              foods={meals.lunch}
              onAdd={handleAddFood}
            />
            <MealSection
              title="Dinner"
              foods={meals.dinner}
              onAdd={handleAddFood}
            />
            <MealSection
              title="Snacks"
              foods={meals.snacks}
              onAdd={handleAddFood}
            />
          </div>
        </>
      )}

      {/* Add Food Modal */}
      {showAddFood && (
        <AddFoodModal
          isOpen={showAddFood}
          onClose={() => setShowAddFood(false)}
          onAddFood={handleAddFoodToMeal}
          selectedMeal={selectedMeal || 'breakfast'}
          selectedDate={date.toISOString().split('T')[0]}
        />
      )}

      {/* Edit Food Modal */}
      {showEditFood && foodToEdit && (
        <EditFoodModal
          isOpen={showEditFood}
          onClose={() => {
            setShowEditFood(false);
            setFoodToEdit(null);
          }}
          foodItem={foodToEdit}
          selectedMeal={selectedMeal}
          selectedDate={date.toISOString().split('T')[0]}
          onUpdateFood={handleUpdateFood}
          onDeleteFood={handleDeleteFood}
        />
      )}
    </div>
  );
};

export default Dashboard;

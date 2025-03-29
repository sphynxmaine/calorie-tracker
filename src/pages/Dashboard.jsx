import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { onAuthState, setAuthPersistence, signOutUser } from "../auth";
import { db, auth, standardizeFoodItem, getFoodDisplayName } from "../firebase";
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, onSnapshot, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import "../index.css";
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import DailyCalorieProgress from '../components/DailyCalorieProgress';
import MacroNutrients from '../components/MacroNutrients';
import AddFoodToDiaryModal from '../components/AddFoodToDiaryModal';
import { LoadingState } from '../components/LoadingState';
import MealSection from '../components/MealSection';
import MobileNavbar from '../components/MobileNavbar';
import { toISODateString, formatDate, formatDisplayDate, getTodayAtMidnight } from '../utils/dateUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  
  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayDate, setDisplayDate] = useState(formatDisplayDate(new Date()));
  
  // Food entry state
  const [isLoading, setIsLoading] = useState(true);
  const [foodEntries, setFoodEntries] = useState([]);
  const [mealSections, setMealSections] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [totalCalories, setTotalCalories] = useState(0);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [error, setError] = useState('');
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const docRef = doc(db, "userProfiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          // Create default profile if none exists
          const defaultProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "User",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            calorieGoal: 2000,
            settings: {
              dailyCalorieGoal: 2000,
              dailyProteinGoal: 150,
              dailyCarbsGoal: 200,
              dailyFatGoal: 65
            }
          };
          
          await setDoc(doc(db, "userProfiles", currentUser.uid), defaultProfile);
          setUserProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile. Please try again.");
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);
  
  // Update display date when selected date changes
  useEffect(() => {
    setDisplayDate(formatDisplayDate(selectedDate));
  }, [selectedDate]);
  
  // Fetch food entries when the selected date changes
  useEffect(() => {
    const fetchFoodEntries = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Format the selected date for query
        const dateString = toISODateString(selectedDate);
        
        // Query food entries for the user and selected date
        const foodEntriesRef = collection(db, 'foodEntries');
        const q = query(
          foodEntriesRef,
          where('userId', '==', currentUser.uid),
          where('date', '==', dateString)
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const entries = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            entries.push({
              id: doc.id,
              ...data,
              // Ensure the food display name is correct
              displayName: getFoodDisplayName(data.food || data)
            });
          });
          
          // Group entries by meal type
          const meals = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          };
          
          // Calculate nutritional totals
          let totalCals = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          
          entries.forEach(entry => {
            // Normalize meal type
            const mealType = (entry.mealType || entry.meal || 'snacks').toLowerCase();
            
            // Add to appropriate meal group
            if (meals[mealType]) {
              meals[mealType].push(entry);
            } else {
              meals.snacks.push(entry);
            }
            
            // Add to nutritional totals
            totalCals += Number(entry.calories || entry.food?.calories || 0);
            totalProtein += Number(entry.protein || entry.food?.protein || 0);
            totalCarbs += Number(entry.carbs || entry.food?.carbs || 0);
            totalFat += Number(entry.fat || entry.food?.fat || 0);
          });
          
          // Update state with entries and calculations
          setFoodEntries(entries);
          setMealSections(meals);
          setTotalCalories(Math.round(totalCals));
          setMacros({
            protein: Math.round(totalProtein),
            carbs: Math.round(totalCarbs),
            fat: Math.round(totalFat)
          });
          
          setIsLoading(false);
        });
        
        // Clean up listener on unmount or when date changes
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching food entries:", error);
        setError("Failed to load your food diary. Please try again.");
        setIsLoading(false);
      }
    };
    
    fetchFoodEntries();
  }, [currentUser, selectedDate]);
  
  // Listen for add food events
  useEffect(() => {
    const handleOpenAddFoodModal = (event) => {
      const mealName = event.detail?.meal || 'breakfast';
      setSelectedMeal(mealName);
      setIsAddModalOpen(true);
    };
    
    window.addEventListener('openAddFoodModal', handleOpenAddFoodModal);
    
    // Check if we have a pending add food request in session storage
    const pendingAddFood = JSON.parse(sessionStorage.getItem('pendingAddFood'));
    if (pendingAddFood) {
      // Clear the pending request immediately to prevent repeated handling
      sessionStorage.removeItem('pendingAddFood');
      
      // Open the add food modal with the saved meal type
      setSelectedMeal(pendingAddFood.mealType || 'breakfast');
      setTimeout(() => setIsAddModalOpen(true), 100);
    }
    
    return () => {
      window.removeEventListener('openAddFoodModal', handleOpenAddFoodModal);
    };
  }, []);
  
  // Handler for adding food to a specific meal
  const handleAddFood = (mealType = 'breakfast') => {
    setSelectedMeal(mealType);
    setIsAddModalOpen(true);
  };
  
  // Date navigation handlers
  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };
  
  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };
  
  // Handler for refreshing entries after add/edit/delete
  const refreshEntries = () => {
    // The real-time listener will update automatically
    // This is a placeholder for additional refresh logic if needed
  };
  
  if (!currentUser) {
    return <LoadingState text="Please log in to view your dashboard" />;
  }
  
  return (
    <div className={`min-h-screen pb-24 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <PageHeader
        title="Food Diary"
        showBackButton={false}
      />
      
      {/* Date Navigation */}
      <div className="flex justify-between items-center px-4 mb-6">
        <button
          onClick={handlePreviousDay}
          className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold">{displayDate}</h2>
          <button
            onClick={handleTodayClick}
            className={`text-xs px-2 py-1 rounded ${
              isDarkMode
                ? 'text-blue-400 hover:bg-gray-800'
                : 'text-blue-600 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
        </div>
        
        <button
          onClick={handleNextDay}
          className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {error && (
        <div className={`mx-4 mb-4 p-3 rounded ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}
      
      {isLoading ? (
        <LoadingState text="Loading your food diary..." />
      ) : (
        <div className="px-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <DailyCalorieProgress 
              consumed={totalCalories} 
              target={userProfile?.calorieGoal || userProfile?.settings?.dailyCalorieGoal || 2000} 
            />
            <MacroNutrients 
              protein={macros.protein} 
              carbs={macros.carbs} 
              fat={macros.fat} 
            />
          </div>
          
          {/* Meal Sections */}
          <div className="space-y-6">
            <MealSection
              title="Breakfast"
              entries={mealSections.breakfast}
              onAddFood={() => handleAddFood('breakfast')}
              refreshEntries={refreshEntries}
              isDarkMode={isDarkMode}
            />
            
            <MealSection
              title="Lunch"
              entries={mealSections.lunch}
              onAddFood={() => handleAddFood('lunch')}
              refreshEntries={refreshEntries}
              isDarkMode={isDarkMode}
            />
            
            <MealSection
              title="Dinner"
              entries={mealSections.dinner}
              onAddFood={() => handleAddFood('dinner')}
              refreshEntries={refreshEntries}
              isDarkMode={isDarkMode}
            />
            
            <MealSection
              title="Snacks"
              entries={mealSections.snacks}
              onAddFood={() => handleAddFood('snacks')}
              refreshEntries={refreshEntries}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}
      
      {/* Mobile Navigation Bar */}
      <MobileNavbar />
      
      {/* Add Food Modal */}
      <AddFoodToDiaryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mealType={selectedMeal}
        date={selectedDate}
        onFoodAdded={refreshEntries}
      />
    </div>
  );
};

export default Dashboard;

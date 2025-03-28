import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, limit, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import PageHeader from '../components/PageHeader';

const LogWeightPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recentWeights, setRecentWeights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchRecentWeights();
  }, []);
  
  const fetchRecentWeights = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Get the user profile first to check for weight history
      const profileRef = doc(db, 'userProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists() && profileSnap.data().weightHistory) {
        // Use the weight history from the profile (already sorted)
        const weightHistory = profileSnap.data().weightHistory || [];
        setRecentWeights(weightHistory.slice(0, 10)); // Get the 10 most recent entries
        setLoading(false);
        return;
      }
      
      // Fallback to querying the weightLogs collection directly
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'weightLogs'),
        where('userId', '==', userId),
        where('date', '>=', weekAgo.toISOString().split('T')[0]),
        orderBy('date', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const weights = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        weights.push({
          date: data.date,
          weight: data.weight
        });
      });
      
      // Sort by date (newest first)
      weights.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setRecentWeights(weights);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent weights:', error);
      setLoading(false);
    }
  };
  
  // Get existing weight log for the selected date if it exists
  const getExistingWeightLogForDate = async (userId, dateStr) => {
    try {
      const weightQuery = query(
        collection(db, 'weightLogs'),
        where('userId', '==', userId),
        where('date', '==', dateStr)
      );
      
      const snapshot = await getDocs(weightQuery);
      let existingLog = null;
      
      snapshot.forEach(doc => {
        // Only take the first one if multiple exist
        if (!existingLog) {
          existingLog = {
            id: doc.id,
            ...doc.data()
          };
        }
      });
      
      return existingLog;
    } catch (error) {
      console.error('Error checking for existing weight log:', error);
      return null;
    }
  };
  
  // Update the user's profile with the latest weight
  const updateUserProfile = async (weightValue) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Format the date consistently
      const dateString = date.toISOString().split('T')[0];
      
      // First, get the current profile to avoid overwriting other data
      const profileRef = doc(db, 'userProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      // Create weight history array if it doesn't exist
      let weightHistory = [];
      
      // Update the profile with the new weight, preserving other fields
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        
        // Get existing weight history or create a new one
        weightHistory = profileData.weightHistory || [];
        
        // Add the new weight entry (avoid duplicates by date)
        const existingEntryIndex = weightHistory.findIndex(entry => entry.date === dateString);
        if (existingEntryIndex >= 0) {
          // Update existing entry
          weightHistory[existingEntryIndex] = {
            date: dateString,
            weight: weightValue
          };
        } else {
          // Add new entry
          weightHistory.push({
            date: dateString,
            weight: weightValue
          });
        }
        
        // Sort by date (newest first)
        weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Keep only the last 90 entries
        if (weightHistory.length > 90) {
          weightHistory = weightHistory.slice(0, 90);
        }
        
        // Store the weight in the profile and track the date it was updated
        await setDoc(profileRef, {
          ...profileData,
          weight: weightValue,
          weightHistory,
          lastWeightUpdate: dateString,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log('Profile updated with new weight:', weightValue);
      } else {
        // If no profile exists, create one with basic weight information
        weightHistory = [{
          date: dateString,
          weight: weightValue
        }];
        
        await setDoc(profileRef, {
          weight: weightValue,
          weightHistory,
          lastWeightUpdate: dateString,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('New profile created with weight:', weightValue);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile with weight:', error);
      throw error;
    }
  };
  
  // Add or update daily weight log entry
  const updateDailyWeightLog = async (userId, date, weightValue) => {
    try {
      // Format the date consistently (YYYY-MM-DD)
      const dateString = date.toISOString().split('T')[0];
      
      // Create a unique ID for the weight log based on user and date
      const weightLogId = `${userId}_${dateString}`;
      
      // Reference to the weight log document
      const weightLogRef = doc(db, 'weightLogs', weightLogId);
      
      // Store the weight log with all required fields
      await setDoc(weightLogRef, {
        userId,
        date: dateString,
        weight: weightValue,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      
      console.log('Weight log updated:', weightValue, 'on', dateString);
      return true;
    } catch (error) {
      console.error('Error updating weight log:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!weight || !date) {
      return;
    }
    
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('No user ID found');
        setLoading(false);
        return;
      }
      
      const weightValue = parseFloat(weight);
      
      // Update the daily weight log
      await updateDailyWeightLog(userId, date, weightValue);
      
      // Update user profile with current weight
      await updateUserProfile(weightValue);
      
      // Success message
      setSuccess(true);
      setWeight('');
      
      // Refresh the recent weights
      await fetchRecentWeights();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      setLoading(false);
    } catch (error) {
      console.error('Error logging weight:', error);
      setLoading(false);
    }
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <PageHeader 
        title="Log Weight" 
        showBackButton={true}
      />
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-6">
            <label 
              htmlFor="weight" 
              className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Weight (kg)
            </label>
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => setWeight(prev => Math.max(1, parseFloat(prev || 1) - 0.1).toFixed(1))}
                className={`p-3 rounded-l-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                -
              </button>
              <input
                type="number"
                id="weight"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter your weight"
                className={`w-full p-3 text-center ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-gray-700' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border-y focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              <button 
                type="button"
                onClick={() => setWeight(prev => (parseFloat(prev || 0) + 0.1).toFixed(1))}
                className={`p-3 rounded-r-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label 
              htmlFor="date" 
              className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full p-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-medium shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''} btn-bounce`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : 'Save Weight'}
          </button>
          
          {success && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center">
              Weight logged successfully!
            </div>
          )}
        </form>
        
        {/* Recent Weights */}
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h2 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Weight Entries
            </h2>
          </div>
          
          {recentWeights.length > 0 ? (
            <div>
              {recentWeights.map((entry) => (
                <div 
                  key={entry.date} 
                  className={`px-6 py-4 flex justify-between items-center ${
                    isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
                  }`}
                >
                  <div className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {entry.weight} kg
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No recent weight entries. Start logging your weight today!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogWeightPage; 
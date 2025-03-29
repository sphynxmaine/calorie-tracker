import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, limit, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import PageHeader from '../components/PageHeader';
import { format } from 'date-fns';
import { formatDate, generateUniqueId, formatDisplayDate, getTodayAtMidnight, calculateBMI, getBMICategory } from '../utils/helpers';
import { LoadingButton } from '../components/LoadingState';

const LogWeightPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'lbs'
  const [date, setDate] = useState(formatDate(new Date()));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastEntries, setLastEntries] = useState([]);
  const [hasExistingEntryForToday, setHasExistingEntryForToday] = useState(false);
  const [existingEntryId, setExistingEntryId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchLastEntries();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigate('/login');
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        
        // Set the preferred weight unit from the user profile
        if (userData.weightUnit) {
          setWeightUnit(userData.weightUnit);
        }
        
        // If we don't have a weight set yet and there's a current weight in profile, use it
        if (!weight && userData.currentWeight) {
          const weightValue = userData.weightUnit === 'lbs' 
            ? (userData.currentWeight * 2.205).toFixed(1) 
            : userData.currentWeight.toFixed(1);
          setWeight(weightValue);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile data');
    }
  };
  
  const fetchLastEntries = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const weightLogsRef = collection(db, 'weightLogs');
      const q = query(
        weightLogsRef,
        where('userId', '==', userId),
        where('deleted', '==', false),
        orderBy('dateFormatted', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const entries = [];
      let todayEntry = null;
      const today = formatDate(getTodayAtMidnight());
      
      querySnapshot.forEach((doc) => {
        const entry = doc.data();
        
        // Ensure date is in a consistent format for display
        let displayDate = '';
        if (entry.dateFormatted) {
          displayDate = formatDisplayDate(new Date(entry.dateFormatted));
        } else if (entry.date instanceof Timestamp) {
          displayDate = formatDisplayDate(entry.date.toDate());
        } else {
          displayDate = formatDisplayDate(new Date(entry.date));
        }
        
        entries.push({
          id: doc.id,
          ...entry,
          displayDate
        });
        
        // Check if there's an entry for today
        const entryDate = entry.dateFormatted || 
          (entry.date instanceof Timestamp ? 
            formatDate(entry.date.toDate()) : 
            formatDate(new Date(entry.date)));
            
        if (entryDate === today) {
          todayEntry = entry;
          setExistingEntryId(doc.id);
        }
      });
      
      setLastEntries(entries);
      setHasExistingEntryForToday(!!todayEntry);
      
      // If there's an entry for today, pre-fill the form
      if (todayEntry) {
        setWeight(String(todayEntry.weight));
        setWeightUnit(todayEntry.weightUnit || 'kg');
        setNotes(todayEntry.notes || '');
      }
    } catch (error) {
      console.error('Error fetching weight logs:', error);
      setError('Failed to load weight history');
    }
  };

  const updateDailyWeightLog = async () => {
    try {
      if (!weight.trim()) {
        setError('Please enter your weight');
        return false;
      }
      
      const numWeight = parseFloat(weight);
      if (isNaN(numWeight) || numWeight <= 0) {
        setError('Please enter a valid weight');
        return false;
      }
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigate('/login');
        return false;
      }
      
      // Format the date consistently
      const selectedDate = new Date(date);
      const timestamp = Timestamp.fromDate(selectedDate);
      const dateFormatted = formatDate(selectedDate);
      
      // Prepare weight data
      const weightInKg = weightUnit === 'lbs' ? numWeight / 2.205 : numWeight;
      const weightData = {
        userId,
        weight: numWeight,
        weightInKg,
        weightUnit,
        date: timestamp,
        dateFormatted,
        notes,
        deleted: false,
        updatedAt: Timestamp.now()
      };
      
      let docRef;
      
      if (hasExistingEntryForToday && existingEntryId) {
        // Update existing entry
        docRef = doc(db, 'weightLogs', existingEntryId);
        await updateDoc(docRef, weightData);
      } else {
        // Create new entry with a unique ID
        const weightLogId = generateUniqueId();
        docRef = doc(db, 'weightLogs', weightLogId);
        await setDoc(docRef, {
          ...weightData,
          createdAt: Timestamp.now()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating weight log:', error);
      setError('Failed to save weight log. Please try again.');
      return false;
    }
  };

  const updateUserProfile = async (weightInKg) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !userProfile) return false;
      
      const userRef = doc(db, 'users', userId);
      
      // Calculate BMI if height is available
      let bmi = null;
      let bmiCategory = null;
      if (userProfile.height) {
        bmi = calculateBMI(weightInKg, userProfile.height);
        bmiCategory = getBMICategory(bmi);
      }
      
      await updateDoc(userRef, {
        currentWeight: weightInKg,
        weightUnit,
        bmi,
        bmiCategory,
        lastWeightUpdate: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      setError('Failed to update your profile. Please try again.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      // Convert weight to kg for storage
      const numWeight = parseFloat(weight);
      const weightInKg = weightUnit === 'lbs' ? numWeight / 2.205 : numWeight;
      
      // Update weight log
      const logUpdated = await updateDailyWeightLog();
      if (!logUpdated) {
        setIsLoading(false);
        return;
      }
      
      // Update user profile with current weight
      const profileUpdated = await updateUserProfile(weightInKg);
      
      setIsLoading(false);
      
      if (logUpdated && profileUpdated) {
        setSuccess('Weight logged successfully!');
        fetchLastEntries(); // Refresh the entries list
        
        // Clear form if it's a new entry
        if (!hasExistingEntryForToday) {
          setNotes('');
        }
      }
    } catch (error) {
      console.error('Error logging weight:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleWeightUnitChange = (unit) => {
    if (unit === weightUnit) return;
    
    // Convert the current weight value when changing units
    if (weight) {
      const numWeight = parseFloat(weight);
      if (!isNaN(numWeight)) {
        if (unit === 'kg' && weightUnit === 'lbs') {
          // Convert from lbs to kg
          setWeight((numWeight / 2.205).toFixed(1));
        } else if (unit === 'lbs' && weightUnit === 'kg') {
          // Convert from kg to lbs
          setWeight((numWeight * 2.205).toFixed(1));
        }
      }
    }
    
    setWeightUnit(unit);
  };

  const goToGraphsPage = () => {
    navigate('/graphs');
  };

  const deleteWeightLog = async (logId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this weight log?')) {
        return;
      }
      
      setIsLoading(true);
      
      // Instead of permanently deleting, mark as deleted
      await updateDoc(doc(db, 'weightLogs', logId), {
        deleted: true,
        updatedAt: Timestamp.now()
      });
      
      setSuccess('Weight log deleted');
      fetchLastEntries(); // Refresh the list
      
      // If we deleted today's entry, reset the form
      if (hasExistingEntryForToday && logId === existingEntryId) {
        setWeight('');
        setNotes('');
        setHasExistingEntryForToday(false);
        setExistingEntryId(null);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting weight log:', error);
      setError('Failed to delete weight log');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <PageHeader 
        title="Log Weight" 
        showBackButton={true}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-md">
        {error && (
          <div className={`mb-4 p-3 rounded-md ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={`mb-4 p-3 rounded-md ${isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'}`}>
            {success}
          </div>
        )}
        
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">
            {hasExistingEntryForToday ? 'Update Today\'s Weight' : 'Log Your Weight'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full p-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                max={formatDate(new Date())}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Weight</label>
              <div className="flex">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.1"
                  min="0"
                  className={`flex-1 p-2 rounded-l border-t border-b border-l ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder={`Weight in ${weightUnit}`}
                  required
                />
                <div className="flex border-t border-b border-r rounded-r overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleWeightUnitChange('kg')}
                    className={`px-3 py-2 ${
                      weightUnit === 'kg'
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWeightUnitChange('lbs')}
                    className={`px-3 py-2 ${
                      weightUnit === 'lbs'
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full p-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="How are you feeling today?"
                rows="3"
              />
            </div>
            
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText="Saving..."
              defaultText={hasExistingEntryForToday ? 'Update Weight' : 'Log Weight'}
              disabled={isLoading}
              className="w-full py-2"
            />
          </form>
        </div>
        
        {lastEntries.length > 0 && (
          <div className={`mt-6 p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Entries</h2>
              <button
                onClick={goToGraphsPage}
                className={`text-sm px-3 py-1 rounded ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                View Graph
              </button>
            </div>
            
            <div className="space-y-3">
              {lastEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex justify-between items-center p-3 rounded ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div>
                    <div className="font-medium">{entry.displayDate}</div>
                    <div className="text-sm opacity-75">
                      {entry.weight} {entry.weightUnit || 'kg'}
                      {entry.notes && (
                        <span className="ml-2">- {entry.notes.length > 20 ? `${entry.notes.substring(0, 20)}...` : entry.notes}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWeightLog(entry.id)}
                    className={`p-1 rounded ${
                      isDarkMode ? 'hover:bg-red-800 text-red-400' : 'hover:bg-red-100 text-red-600'
                    }`}
                    title="Delete entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogWeightPage; 
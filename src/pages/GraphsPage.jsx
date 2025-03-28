import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const GraphsPage = () => {
  const { isDarkMode } = useTheme();
  const [weightData, setWeightData] = useState([]);
  const [calorieData, setCalorieData] = useState([]);
  const [macroData, setMacroData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [activeGraph, setActiveGraph] = useState('weight'); // 'weight', 'calories', 'macros'

  // Fetch user's weight history
  const fetchWeightHistory = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const daysToFetch = timeRangeToDays(selectedTimeRange);
      const startDate = subDays(new Date(), daysToFetch).toISOString().split('T')[0];

      // First try to get weight history from user profile (preferred method)
      const profileRef = doc(db, "userProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists() && profileSnap.data().weightHistory) {
        // Filter weight history by date range
        const weightHistory = profileSnap.data().weightHistory
          .filter(entry => entry.date >= startDate)
          .map(entry => ({
            date: entry.date,
            weight: entry.weight,
            formattedDate: format(new Date(entry.date), 'MMM d')
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ascending by date
        
        if (weightHistory.length > 0) {
          setWeightData(weightHistory);
          return;
        }
      }
      
      // Fallback to weightLogs collection if no data in profile
      const weightQuery = query(
        collection(db, "weightLogs"),
        where("userId", "==", userId),
        where("date", ">=", startDate),
        orderBy("date", "asc")
      );

      const weightSnapshot = await getDocs(weightQuery);
      
      // Process weight logs and deduplicate by date (use most recent entry for each day)
      const weightEntriesByDate = {};
      
      weightSnapshot.forEach(doc => {
        const data = doc.data();
        const dateStr = data.date;
        
        // If we already have an entry for this date, only replace if this one is newer
        if (!weightEntriesByDate[dateStr] || 
            new Date(data.timestamp || data.createdAt) > 
            new Date(weightEntriesByDate[dateStr].timestamp || weightEntriesByDate[dateStr].createdAt)) {
          weightEntriesByDate[dateStr] = data;
        }
      });
      
      // Convert to array and format for display
      const weightHistory = Object.values(weightEntriesByDate)
        .map(entry => ({
          date: entry.date,
          weight: entry.weight,
          formattedDate: format(new Date(entry.date), 'MMM d')
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ascending by date
      
      setWeightData(weightHistory);
      
      // If we found data in weightLogs but not in profile, update the profile for future queries
      if (weightHistory.length > 0 && (!profileSnap.exists() || !profileSnap.data().weightHistory)) {
        try {
          await setDoc(profileRef, {
            weightHistory: weightHistory.map(entry => ({
              date: entry.date,
              weight: entry.weight
            })),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Error updating profile with weight history:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching weight history:", error);
    }
  };

  // Fetch user's calorie history
  const fetchCalorieHistory = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const daysToFetch = timeRangeToDays(selectedTimeRange);
      const startDate = subDays(new Date(), daysToFetch).toISOString().split('T')[0];

      const foodQuery = query(
        collection(db, "foodEntries"),
        where("userId", "==", userId),
        where("date", ">=", startDate),
        orderBy("date", "asc")
      );

      const foodSnapshot = await getDocs(foodQuery);
      
      // Group entries by date
      const dailyCalories = {};
      foodSnapshot.docs.forEach(doc => {
        const entry = doc.data();
        const date = entry.date;
        if (!dailyCalories[date]) {
          dailyCalories[date] = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            mealCounts: {
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              snacks: 0
            }
          };
        }
        dailyCalories[date].calories += Number(entry.calories || 0);
        dailyCalories[date].protein += Number(entry.protein || 0);
        dailyCalories[date].carbs += Number(entry.carbs || 0);
        dailyCalories[date].fat += Number(entry.fat || 0);
        dailyCalories[date].mealCounts[entry.meal.toLowerCase()]++;
      });

      // Convert to array and format for charts
      const calorieHistory = Object.entries(dailyCalories).map(([date, data]) => ({
        date: date,
        formattedDate: format(new Date(date), 'MMM d'),
        calories: Math.round(data.calories),
        protein: Math.round(data.protein),
        carbs: Math.round(data.carbs),
        fat: Math.round(data.fat),
        ...data.mealCounts
      }));

      setCalorieData(calorieHistory);
      setMacroData(calorieHistory);
    } catch (error) {
      console.error("Error fetching calorie history:", error);
    }
  };

  // Convert time range to days
  const timeRangeToDays = (range) => {
    switch (range) {
      case '7d': return 7;
      case '14d': return 14;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  // Fetch data when time range changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchWeightHistory(),
        fetchCalorieHistory()
      ]);
      setIsLoading(false);
    };

    if (auth.currentUser) {
      fetchData();
    }
  }, [selectedTimeRange]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'weight' ? 'lbs' : entry.name === 'calories' ? 'cal' : 'g'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Time range selector component
  const TimeRangeSelector = () => (
    <div className="flex space-x-2 mb-4">
      {[
        { label: '7D', value: '7d' },
        { label: '14D', value: '14d' },
        { label: '30D', value: '30d' },
        { label: '90D', value: '90d' }
      ].map(range => (
        <button
          key={range.value}
          onClick={() => setSelectedTimeRange(range.value)}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
            selectedTimeRange === range.value
              ? 'bg-blue-600 text-white'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );

  // Graph type selector component
  const GraphTypeSelector = () => (
    <div className="flex space-x-2 mb-6">
      {[
        { label: 'Weight History', value: 'weight' },
        { label: 'Calorie Trends', value: 'calories' },
        { label: 'Macro Breakdown', value: 'macros' }
      ].map(type => (
        <button
          key={type.value}
          onClick={() => setActiveGraph(type.value)}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
            activeGraph === type.value
              ? 'bg-blue-600 text-white'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <PageHeader title="Progress & Insights" />
      
      <div className="p-4">
        <GraphTypeSelector />
        <TimeRangeSelector />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weight History Graph */}
            {activeGraph === 'weight' && weightData.length > 0 && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Weight History</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="formattedDate" 
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                    />
                    <YAxis 
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Calorie Trends Graph */}
            {activeGraph === 'calories' && calorieData.length > 0 && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Daily Calorie Intake</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={calorieData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="formattedDate" 
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                    />
                    <YAxis 
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="calories" 
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Macro Breakdown Graph */}
            {activeGraph === 'macros' && macroData.length > 0 && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Macro Nutrient Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={macroData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="formattedDate" 
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                    />
                    <YAxis 
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="protein" stackId="a" fill="#10B981" name="Protein" />
                    <Bar dataKey="carbs" stackId="a" fill="#3B82F6" name="Carbs" />
                    <Bar dataKey="fat" stackId="a" fill="#F59E0B" name="Fat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* No Data Message */}
            {((activeGraph === 'weight' && weightData.length === 0) ||
              (activeGraph === 'calories' && calorieData.length === 0) ||
              (activeGraph === 'macros' && macroData.length === 0)) && (
              <div className={`p-8 text-center rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <p className="text-lg">No data available for the selected time range.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start logging your {activeGraph === 'weight' ? 'weight' : 'meals'} to see your progress here!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphsPage;
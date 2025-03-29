import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from "../firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import MobileNavbar from '../components/MobileNavbar';
import { LoadingState } from '../components/LoadingState';
import { toISODateString, formatDate } from '../utils/dateUtils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GraphsPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const [weightHistory, setWeightHistory] = useState([]);
  const [calorieHistory, setCalorieHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  
  // Fetch user profile and weight history on component mount
  useEffect(() => {
    const fetchUserDataAndHistory = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch user profile to get their current weight
        const userProfileDoc = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        if (userProfileDoc.exists()) {
          setUserProfile(userProfileDoc.data());
        }
        
        // Fetch weight logs for the user
        const weightLogsQuery = query(
          collection(db, 'weightLogs'),
          where('userId', '==', currentUser.uid),
          orderBy('date', 'asc')
        );
        
        const weightLogsSnapshot = await getDocs(weightLogsQuery);
        const weightData = [];
        
        weightLogsSnapshot.forEach(doc => {
          const log = doc.data();
          
          // Convert Firestore Timestamp to JavaScript Date if needed
          const date = log.date instanceof Timestamp ? log.date.toDate() : new Date(log.date);
          
          weightData.push({
            id: doc.id,
            date: formatDate(date),
            weight: log.weight,
            formattedDate: date.toLocaleDateString()
          });
        });
        
        setWeightHistory(weightData);
        
        // Fetch food entries to calculate daily calories
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const foodEntriesQuery = query(
          collection(db, 'foodEntries'),
          where('userId', '==', currentUser.uid),
          where('createdAt', '>=', thirtyDaysAgo)
        );
        
        const foodEntriesSnapshot = await getDocs(foodEntriesQuery);
        
        // Process food entries to calculate daily totals
        const dailyCalories = {};
        
        foodEntriesSnapshot.forEach(doc => {
          const entry = doc.data();
          const date = entry.date || (entry.createdAt instanceof Timestamp 
            ? toISODateString(entry.createdAt.toDate())
            : toISODateString(new Date(entry.createdAt)));
          
          if (!dailyCalories[date]) {
            dailyCalories[date] = 0;
          }
          
          dailyCalories[date] += Number(entry.calories || 0);
        });
        
        // Convert to array format for the chart
        const calorieData = Object.entries(dailyCalories).map(([date, calories]) => ({
          date,
          calories: Math.round(calories),
          formattedDate: new Date(date).toLocaleDateString()
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setCalorieHistory(calorieData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load your history. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchUserDataAndHistory();
  }, [currentUser]);
  
  // Configure chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
        titleColor: isDarkMode ? '#FFFFFF' : '#111827',
        bodyColor: isDarkMode ? '#D1D5DB' : '#4B5563',
        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
      }
    }
  };
  
  // Prepare weight chart data
  const weightChartData = {
    labels: weightHistory.map(entry => entry.formattedDate),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightHistory.map(entry => entry.weight),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.2,
      }
    ]
  };
  
  // Prepare calorie chart data
  const calorieChartData = {
    labels: calorieHistory.map(entry => entry.formattedDate),
    datasets: [
      {
        label: 'Calories',
        data: calorieHistory.map(entry => entry.calories),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.2,
      }
    ]
  };
  
  if (!currentUser) {
    return <LoadingState text="Please log in to view your graphs" />;
  }
  
  return (
    <div className={`min-h-screen pb-24 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <PageHeader
        title="Progress Graphs"
        showBackButton={true}
        onBackClick={() => navigate('/dashboard')}
      />
      
      {isLoading ? (
        <LoadingState text="Loading your progress data..." />
      ) : error ? (
        <div className={`mx-4 my-6 p-4 rounded ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      ) : (
        <div className="px-4">
          {/* Weight History Chart */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h2 className="text-lg font-semibold mb-4">Weight History</h2>
            
            {weightHistory.length > 0 ? (
              <div className="h-64">
                <Line data={weightChartData} options={chartOptions} />
              </div>
            ) : (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No weight history data available.
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/log-weight')}
                    className={`px-4 py-2 rounded ${
                      isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-medium`}
                  >
                    Log Weight
                  </button>
                </div>
              </div>
            )}
            
            {weightHistory.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Latest Weight:
                    </span>
                    <span className="ml-2 font-bold">
                      {weightHistory[weightHistory.length - 1]?.weight} kg
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/log-weight')}
                    className={`px-3 py-1 rounded ${
                      isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white text-sm`}
                  >
                    Log Weight
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Calorie History Chart */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h2 className="text-lg font-semibold mb-4">Calorie History</h2>
            
            {calorieHistory.length > 0 ? (
              <div className="h-64">
                <Line data={calorieChartData} options={chartOptions} />
              </div>
            ) : (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No calorie data available.
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`px-4 py-2 rounded ${
                      isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-medium`}
                  >
                    Go to Food Diary
                  </button>
                </div>
              </div>
            )}
            
            {calorieHistory.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Avg. Daily Calories:
                    </span>
                    <span className="ml-2 font-bold">
                      {Math.round(
                        calorieHistory.reduce((sum, entry) => sum + entry.calories, 0) / calorieHistory.length
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`px-3 py-1 rounded ${
                      isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white text-sm`}
                  >
                    Food Diary
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Weight Data Table */}
          {weightHistory.length > 0 && (
            <div className={`mb-6 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className="text-lg font-semibold p-4 border-b border-opacity-10">Weight Log</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                      <th className="py-2 px-4 text-left">Date</th>
                      <th className="py-2 px-4 text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightHistory.slice().reverse().map((entry) => (
                      <tr key={entry.id} className={`border-t border-opacity-10 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className="py-3 px-4">{entry.formattedDate}</td>
                        <td className="py-3 px-4 text-right font-medium">{entry.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      <MobileNavbar />
    </div>
  );
};

export default GraphsPage;
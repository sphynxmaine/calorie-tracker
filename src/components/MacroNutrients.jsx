import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const MacroNutrients = ({ protein, carbs, fat }) => {
  const { isDarkMode } = useTheme();
  
  // Calculate total grams
  const totalGrams = protein + carbs + fat;
  
  // Calculate percentages if there's any data
  const calculatePercentage = (value) => {
    if (totalGrams === 0) return 0;
    return Math.round((value / totalGrams) * 100);
  };
  
  const proteinPercentage = calculatePercentage(protein);
  const carbsPercentage = calculatePercentage(carbs);
  const fatPercentage = calculatePercentage(fat);
  
  // Prepare data for the pie chart
  const data = [
    { name: 'Protein', value: protein, percentage: proteinPercentage },
    { name: 'Carbs', value: carbs, percentage: carbsPercentage },
    { name: 'Fat', value: fat, percentage: fatPercentage }
  ];
  
  // Filter out zero values
  const chartData = data.filter(item => item.value > 0);
  
  // Colors for the pie chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-2 rounded shadow-md text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <p className="font-medium">{payload[0].name}</p>
          <p>{payload[0].value}g ({payload[0].payload.percentage}%)</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Macronutrients
      </h3>
      
      <div className="flex items-center">
        {totalGrams > 0 ? (
          <div className="w-24 h-24 mr-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-24 h-24 mr-4 flex items-center justify-center">
            <div className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No data
            </div>
          </div>
        )}
        
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Protein</span>
              </div>
              <div className="mt-1">
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{protein}g</span>
                <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {proteinPercentage}%
                </span>
              </div>
            </div>
            
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Carbs</span>
              </div>
              <div className="mt-1">
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{carbs}g</span>
                <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {carbsPercentage}%
                </span>
              </div>
            </div>
            
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fat</span>
              </div>
              <div className="mt-1">
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fat}g</span>
                <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {fatPercentage}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-center">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Total: {totalGrams}g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

MacroNutrients.propTypes = {
  protein: PropTypes.number.isRequired,
  carbs: PropTypes.number.isRequired,
  fat: PropTypes.number.isRequired
};

export default MacroNutrients; 
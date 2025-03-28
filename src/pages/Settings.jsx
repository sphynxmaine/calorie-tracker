import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../auth';
import PageHeader from '../components/PageHeader';

const Settings = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const SettingButton = ({ title, value, onClick, showArrow = true, isLast = false }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 ${!isLast && (isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-200')}`}
    >
      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{title}</span>
      <div className="ml-auto flex items-center">
        {value && (
          <span className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{value}</span>
        )}
        {showArrow && (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <PageHeader title="Settings" />
      
      <div className="px-4 py-6">
        {/* Account Section */}
        <div className={`mb-6 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <SettingButton
            title="Profile"
            onClick={() => navigate('/profile')}
          />
          <SettingButton
            title="Account Settings"
            onClick={() => {}}
          />
          <SettingButton
            title="Privacy & Security"
            onClick={() => {}}
            isLast
          />
        </div>

        {/* Preferences Section */}
        <div className={`mb-6 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <SettingButton
            title="Dark Mode"
            value={isDarkMode ? "On" : "Off"}
            onClick={toggleDarkMode}
            showArrow={false}
          />
          <SettingButton
            title="Notifications"
            onClick={() => {}}
          />
          <SettingButton
            title="Language"
            value="English"
            onClick={() => {}}
            isLast
          />
        </div>

        {/* Support Section */}
        <div className={`mb-6 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <SettingButton
            title="Help & Support"
            onClick={() => {}}
          />
          <SettingButton
            title="About"
            onClick={() => {}}
            isLast
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full py-3 px-4 rounded-lg ${
            isDarkMode 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-red-500 hover:bg-red-600'
          } text-white font-medium shadow`}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Settings; 
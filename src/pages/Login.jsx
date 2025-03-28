// src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, resetPassword, ensureDemoUserExists } from '../auth';
import { useTheme } from '../context/ThemeContext';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    // Use demo credentials
    try {
      console.log('Attempting demo login...');
      
      try {
        // Try to ensure demo user exists first
        await ensureDemoUserExists();
      } catch (createError) {
        console.error('Error ensuring demo user exists:', createError);
        // Continue anyway, as the user might already exist
      }
      
      // Try to sign in with demo credentials
      await signIn('demo@example.com', 'password123');
      navigate('/');
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo login failed. Please try again or create a regular account.');
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className={`${
        isDarkMode 
          ? 'bg-gradient-to-b from-blue-800 to-blue-600'
          : 'bg-gradient-to-b from-blue-600 to-blue-400'
      } text-white p-4 text-center`}>
        <h1 className="text-2xl font-bold">Login</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {resetSent && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                Password reset email sent! Check your inbox.
              </div>
            )}
            
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-700 text-white placeholder-gray-400'
                    : 'border-gray-300 placeholder-gray-500 text-gray-900'
                } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-700 text-white placeholder-gray-400'
                    : 'border-gray-300 placeholder-gray-500 text-gray-900'
                } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetPassword}
                className={`text-sm ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                Forgot your password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                  Or continue with
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border ${
                  isDarkMode ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-700'
                } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Try Demo Account
              </button>
            </div>

            <div className={`text-sm text-center ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <Link to="/signup" className={`font-medium ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}>
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      <DarkModeToggle position="top-left" />
    </div>
  );
}

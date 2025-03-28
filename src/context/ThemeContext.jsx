import React, { createContext, useState, useEffect, useContext } from 'react';

// Create a context for theme management
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if dark mode is stored in localStorage, default to user's system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check user's system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  // Toggle dark mode
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Set specific mode
  const setDarkMode = (value) => {
    setIsDarkMode(value);
  };

  // Update localStorage and apply theme when dark mode changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      
      // Add dark mode CSS variables to :root
      document.documentElement.style.setProperty('--color-bg-primary', '#111827');
      document.documentElement.style.setProperty('--color-bg-secondary', '#1F2937');
      document.documentElement.style.setProperty('--color-bg-tertiary', '#374151');
      document.documentElement.style.setProperty('--color-text-primary', '#F9FAFB');
      document.documentElement.style.setProperty('--color-text-secondary', '#D1D5DB');
      document.documentElement.style.setProperty('--color-border', '#4B5563');
      
      // Add a class to the body for global styling
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      
      // Ensure proper contrast for all text elements
      const style = document.createElement('style');
      style.id = 'dark-mode-styles';
      style.textContent = `
        .dark-mode {
          background-color: #111827;
          color: #F9FAFB;
        }
        .dark-mode input, .dark-mode textarea, .dark-mode select {
          background-color: #1F2937;
          color: #F9FAFB;
          border-color: #4B5563;
        }
        .dark-mode button:not([class*="bg-"]) {
          background-color: #1F2937;
          color: #F9FAFB;
        }
        .dark-mode ::placeholder {
          color: #9CA3AF;
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('dark-mode-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add the new style
      document.head.appendChild(style);
      
    } else {
      document.documentElement.classList.remove('dark');
      
      // Reset to light mode CSS variables
      document.documentElement.style.setProperty('--color-bg-primary', '#FFFFFF');
      document.documentElement.style.setProperty('--color-bg-secondary', '#F3F4F6');
      document.documentElement.style.setProperty('--color-bg-tertiary', '#E5E7EB');
      document.documentElement.style.setProperty('--color-text-primary', '#111827');
      document.documentElement.style.setProperty('--color-text-secondary', '#4B5563');
      document.documentElement.style.setProperty('--color-border', '#D1D5DB');
      
      // Update body class
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      
      // Remove dark mode specific styles
      const existingStyle = document.getElementById('dark-mode-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }, [isDarkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(mediaQuery.matches);
      }
    };

    // Use the appropriate event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 
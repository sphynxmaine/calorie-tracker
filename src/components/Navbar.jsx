import { Link, useNavigate } from 'react-router-dom';
import { logOut } from '../auth';
import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          setIsAdmin(false);
          return;
        }
        
        // In a real app, you would check against a list of admin UIDs in Firestore
        // For this example, we'll use a simple array of admin emails
        const adminEmails = ['admin@example.com', 'youremail@example.com'];
        const isUserAdmin = adminEmails.includes(user.email);
        
        setIsAdmin(isUserAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAdminStatus();
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className={`${isDarkMode ? 'bg-dark-bg-secondary text-dark-text-primary' : 'bg-white text-gray-900'} shadow-md transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                CalorieTracker
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:border-gray-500' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className={`border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:border-gray-500' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Profile
              </Link>
              <Link
                to="/calculator"
                className={`border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:border-gray-500' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Calorie Calculator
              </Link>
              <Link
                to="/food-database"
                className={`border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:border-gray-500' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Food Database
              </Link>
              <Link
                to="/resources"
                className={`border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:border-gray-500' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Resources
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`border-transparent ${isDarkMode ? 'text-red-400 hover:border-red-400 hover:text-red-300' : 'text-red-500 hover:border-red-300 hover:text-red-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Settings link */}
            <Link
              to="/settings"
              className={`mr-3 p-2 rounded-md ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-tertiary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            
            {/* Dark mode toggle button */}
            <button
              onClick={toggleDarkMode}
              className={`mr-3 p-2 rounded-full ${isDarkMode ? 'bg-dark-bg-tertiary text-yellow-300' : 'bg-gray-200 text-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Logout
            </button>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile settings link */}
            <Link
              to="/settings"
              className={`p-2 rounded-md ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-tertiary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2`}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            
            {/* Mobile dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-dark-bg-tertiary text-yellow-300' : 'bg-gray-200 text-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${isDarkMode ? 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-tertiary' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className={`pt-2 pb-3 space-y-1 ${isDarkMode ? 'bg-dark-bg-secondary' : 'bg-white'}`}>
          <Link
            to="/"
            className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/calculator"
            className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Calorie Calculator
          </Link>
          <Link
            to="/food-database"
            className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Food Database
          </Link>
          <Link
            to="/resources"
            className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Resources
          </Link>
          <Link
            to="/settings"
            className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Settings
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`block pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-red-400 hover:bg-dark-bg-tertiary hover:border-red-400 hover:text-red-300' : 'text-red-600 hover:bg-gray-50 hover:border-red-300 hover:text-red-800'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          <button
            onClick={() => {
              handleLogout();
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent ${isDarkMode ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:border-gray-500 hover:text-dark-text-primary' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
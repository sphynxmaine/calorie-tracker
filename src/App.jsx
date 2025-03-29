// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CalorieCalculator from './pages/CalorieCalculator';
import FoodDatabasePage from './pages/FoodDatabasePage';
import ResourcesPage from './pages/ResourcesPage';
import Settings from './pages/Settings';
import GraphsPage from './pages/GraphsPage';
import LogWeightPage from './pages/LogWeightPage';
import ProtectedRoute from './components/ProtectedRoute';
import MobileNavbar from './components/MobileNavbar';
import Notifications from './components/Notifications';
import DatabaseStatus from './components/DatabaseStatus';
import { auth } from './firebase';
import { ThemeProvider } from './context/ThemeContext';
import { UpdateProvider } from './context/UpdateContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Layout component for protected routes
function ProtectedLayout({ children }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
      <MobileNavbar />
    </div>
  );
}

// Development tools component
function DevTools({ children }) {
  const [showDevMenu, setShowDevMenu] = useState(false);
  
  // Toggle dev menu with Alt+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'd') {
        setShowDevMenu(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <div className="relative">
      {showDevMenu && (
        <div className="fixed top-0 right-0 bg-gray-800 text-white p-4 z-50 rounded-bl-lg shadow-lg">
          <h3 className="text-lg font-bold mb-2">Dev Tools</h3>
          <p className="text-xs">Press Alt+D to toggle</p>
          <hr className="my-2" />
          <div className="space-y-2">
            <p>User: {auth.currentUser?.email || 'Not logged in'}</p>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                alert('Local storage cleared');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Clear Storage
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Main app component
function AppContent({ dbInitialized, dbError }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UpdateProvider>
          <AuthProvider>
            <DevTools>
              <DatabaseStatus initialized={dbInitialized} error={dbError} />
              <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  <Route path="/" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Dashboard />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Profile />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/calculator" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <CalorieCalculator />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/food-database" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <FoodDatabasePage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/resources" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <ResourcesPage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Settings />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/graphs" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <GraphsPage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/log-weight" element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <LogWeightPage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Redirect any unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </DevTools>
          </AuthProvider>
        </UpdateProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default function App({ dbInitialized = true, dbError = null }) {
  return <AppContent dbInitialized={dbInitialized} dbError={dbError} />;
}

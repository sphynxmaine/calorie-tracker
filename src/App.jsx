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
import AdminPage from './pages/AdminPage';
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

// Layout component for protected routes
function ProtectedLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    const checkIfAdmin = async () => {
      if (auth.currentUser) {
        // Admin emails - in a real app, this would be stored in Firestore
        const adminEmails = ['admin@example.com', 'test@example.com'];
        setIsAdmin(adminEmails.includes(auth.currentUser.email));
      }
    };
    
    checkIfAdmin();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-grow container mx-auto px-4 py-8">
        {children}
      </div>
      <MobileNavbar isAdmin={isAdmin} />
    </div>
  );
}

// Development tools component
const DevTools = ({ children }) => {
  const [showDevTools, setShowDevTools] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D to toggle dev tools
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDevTools(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <>
      {children}
      
      {showDevTools && (
        <div className="fixed bottom-16 left-0 right-0 bg-gray-800 text-white p-4 z-50 overflow-auto max-h-64">
          <h3 className="text-lg font-bold mb-2">Dev Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              onClick={() => {
                localStorage.clear();
                console.log('Local storage cleared');
              }}
            >
              Clear Local Storage
            </button>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              onClick={() => {
                console.log('Current user:', auth.currentUser);
              }}
            >
              Log Current User
            </button>
          </div>
        </div>
      )}
    </>
  );
};

function AppContent({ dbInitialized, dbError }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UpdateProvider>
          <DevTools>
            <Notifications />
            <DatabaseStatus initialized={dbInitialized} error={dbError} />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected routes */}
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
              
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <ProtectedLayout>
                    <AdminPage />
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
          </DevTools>
        </UpdateProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default function App({ dbInitialized = true, dbError = null }) {
  return <AppContent dbInitialized={dbInitialized} dbError={dbError} />;
}

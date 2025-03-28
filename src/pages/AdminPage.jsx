import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFoods: 0,
    totalCategories: 0,
    totalUsers: 0
  });
  const [exportFormat, setExportFormat] = useState('json');
  const navigate = useNavigate();

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          navigate('/login');
          return;
        }
        
        // In a real app, you would check against a list of admin UIDs in Firestore
        // For this example, we'll use a simple array of admin emails
        const adminEmails = ['admin@example.com', 'youremail@example.com'];
        const isUserAdmin = adminEmails.includes(user.email);
        
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          setMessage('You do not have permission to access this page.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          // Load database stats
          await loadDatabaseStats();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setMessage('Error checking permissions: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  // Load database statistics
  const loadDatabaseStats = async () => {
    try {
      // Get total foods
      const foodsSnapshot = await getDocs(collection(db, 'sharedFoods'));
      const foods = [];
      foodsSnapshot.forEach(doc => {
        foods.push({ id: doc.id, ...doc.data() });
      });
      
      // Get unique categories
      const categories = new Set();
      foods.forEach(food => {
        if (food.category) {
          categories.add(food.category);
        }
      });
      
      // Get unique users who contributed
      const users = new Set();
      foods.forEach(food => {
        if (food.createdBy) {
          users.add(food.createdBy);
        }
      });
      
      setStats({
        totalFoods: foods.length,
        totalCategories: categories.size,
        totalUsers: users.size
      });
    } catch (error) {
      console.error('Error loading database stats:', error);
      setMessage('Error loading database statistics: ' + error.message);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  // Handle JSON import
  const handleJsonImport = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setMessage('Processing file...');

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const foods = JSON.parse(event.target.result);
          
          // Validate data format
          if (!Array.isArray(foods)) {
            throw new Error('File must contain a JSON array of food items');
          }
          
          let successCount = 0;
          let errorCount = 0;
          
          // Process in smaller batches to avoid Firestore limits
          const batchSize = 400; // Firestore allows up to 500 operations per batch, use 400 to be safe
          
          for (let i = 0; i < foods.length; i += batchSize) {
            // Create a new batch for each chunk of data
            const batch = writeBatch(db);
            const currentBatch = foods.slice(i, i + batchSize);
            
            for (const food of currentBatch) {
              try {
                // Validate required fields
                if (!food.itemName || food.calories === undefined) {
                  throw new Error(`Food item missing required fields: ${food.itemName || 'unnamed'}`);
                }
                
                // Add required metadata
                const foodWithMetadata = {
                  ...food,
                  createdBy: auth.currentUser.uid,
                  createdByName: auth.currentUser.displayName || auth.currentUser.email || 'Admin',
                  createdAt: serverTimestamp(),
                  likes: 0,
                  usageCount: 0
                };
                
                // Add to batch
                const newFoodRef = doc(collection(db, 'sharedFoods'));
                batch.set(newFoodRef, foodWithMetadata);
                successCount++;
              } catch (err) {
                console.error('Error processing food item:', err);
                errorCount++;
              }
            }
            
            // Commit the current batch
            await batch.commit();
          }
          
          setMessage(`Import complete: ${successCount} foods added, ${errorCount} failed`);
          
          // Refresh stats
          await loadDatabaseStats();
        } catch (err) {
          setMessage(`Error processing file: ${err.message}`);
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsText(file);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  // Handle CSV import
  const handleCsvImport = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setMessage('Processing CSV file...');

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const lines = csvText.split('\n');
          
          // Parse header row to get column names
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Map CSV columns to food object properties
          const foods = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const values = parseCSVLine(lines[i]);
            const food = {};
            
            headers.forEach((header, index) => {
              // Map CSV headers to our food object properties
              const value = values[index];
              
              // Convert numeric fields
              if (['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'sodium'].includes(header.toLowerCase())) {
                food[header.toLowerCase()] = value ? parseFloat(value) : 0;
              } else if (header.toLowerCase() === 'name' || header.toLowerCase() === 'itemname') {
                food.itemName = value;
              } else {
                food[header.toLowerCase()] = value;
              }
            });
            
            // Ensure required fields
            if (food.itemName) {
              foods.push(food);
            }
          }
          
          // Now import the foods using the same batch logic as JSON import
          let successCount = 0;
          let errorCount = 0;
          
          // Process in smaller batches
          const batchSize = 400; // Use 400 to be safe
          
          for (let i = 0; i < foods.length; i += batchSize) {
            // Create a new batch for each chunk of data
            const batch = writeBatch(db);
            const currentBatch = foods.slice(i, i + batchSize);
            
            for (const food of currentBatch) {
              try {
                // Add required metadata
                const foodWithMetadata = {
                  ...food,
                  createdBy: auth.currentUser.uid,
                  createdByName: auth.currentUser.displayName || auth.currentUser.email || 'Admin',
                  createdAt: serverTimestamp(),
                  likes: 0,
                  usageCount: 0
                };
                
                // Add to batch
                const newFoodRef = doc(collection(db, 'sharedFoods'));
                batch.set(newFoodRef, foodWithMetadata);
                successCount++;
              } catch (err) {
                console.error('Error processing food item:', err);
                errorCount++;
              }
            }
            
            // Commit the current batch
            await batch.commit();
          }
          
          setMessage(`CSV Import complete: ${successCount} foods added, ${errorCount} failed`);
          
          // Refresh stats
          await loadDatabaseStats();
        } catch (err) {
          setMessage(`Error processing CSV file: ${err.message}`);
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsText(file);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  // Parse CSV line handling quoted values with commas
  const parseCSVLine = (line) => {
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Toggle quote state
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    // Remove quotes from values
    return values.map(value => {
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.substring(1, value.length - 1).replace(/""/g, '"');
      }
      return value;
    });
  };

  // Handle file import based on format
  const handleImport = () => {
    if (file.name.toLowerCase().endsWith('.json')) {
      handleJsonImport();
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      handleCsvImport();
    } else {
      setMessage('Unsupported file format. Please use JSON or CSV files.');
    }
  };

  // Export the database
  const handleExport = async () => {
    try {
      setMessage('Exporting database...');
      
      // Get all foods from the shared database
      const foodsSnapshot = await getDocs(collection(db, 'sharedFoods'));
      const foods = [];
      
      foodsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Convert Firestore timestamp to regular date
        const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        
        foods.push({
          id: doc.id,
          ...data,
          createdAt
        });
      });
      
      let exportData;
      let fileName;
      let mimeType;
      
      if (exportFormat === 'json') {
        // Export as JSON
        exportData = JSON.stringify(foods, null, 2);
        fileName = `food-database-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Export as CSV
        // Create CSV header row
        const headers = ['id', 'itemName', 'category', 'weight', 'calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'sodium', 'createdBy', 'createdByName', 'createdAt', 'likes', 'usageCount'];
        
        // Create CSV rows
        const csvRows = [
          headers.join(','),
          ...foods.map(food => {
            return headers.map(header => {
              const value = food[header];
              // Handle special cases for CSV formatting
              if (value === undefined || value === null) return '';
              if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
              return value;
            }).join(',');
          })
        ];
        
        exportData = csvRows.join('\n');
        fileName = `food-database-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }
      
      // Create download link
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage(`Database exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting database:', error);
      setMessage('Error exporting database: ' + error.message);
    }
  };

  // Clear the entire database (dangerous operation!)
  const handleClearDatabase = async () => {
    if (!window.confirm('WARNING: This will delete ALL foods in the shared database. This action cannot be undone. Are you sure?')) {
      return;
    }
    
    if (!window.confirm('FINAL WARNING: All user-contributed foods will be permanently deleted. Continue?')) {
      return;
    }
    
    try {
      setMessage('Clearing database...');
      
      // Get all foods
      const foodsSnapshot = await getDocs(collection(db, 'sharedFoods'));
      
      // Delete in batches
      const batchSize = 400; // Use 400 to be safe
      let batch = writeBatch(db);
      let count = 0;
      
      foodsSnapshot.forEach(document => {
        batch.delete(doc(db, 'sharedFoods', document.id));
        count++;
        
        if (count >= batchSize) {
          // Commit batch and start a new one
          batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      });
      
      // Commit any remaining deletes
      if (count > 0) {
        await batch.commit();
      }
      
      setMessage(`Database cleared successfully. Deleted ${foodsSnapshot.size} food items.`);
      
      // Refresh stats
      await loadDatabaseStats();
    } catch (error) {
      console.error('Error clearing database:', error);
      setMessage('Error clearing database: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p>{message || 'You do not have permission to access this page.'}</p>
          <p>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Food Database Administration</h1>
      
      {message && (
        <div className={`p-4 rounded mb-6 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {/* Database Statistics */}
      <div className="bg-white p-6 rounded shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-3xl font-bold text-blue-700">{stats.totalFoods}</div>
            <div className="text-sm text-blue-600">Total Foods</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-3xl font-bold text-green-700">{stats.totalCategories}</div>
            <div className="text-sm text-green-600">Categories</div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-3xl font-bold text-purple-700">{stats.totalUsers}</div>
            <div className="text-sm text-purple-600">Contributors</div>
          </div>
        </div>
      </div>
      
      {/* Import Section */}
      <div className="bg-white p-6 rounded shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Import Foods</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File (JSON or CSV)
          </label>
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            JSON files should contain an array of food objects. CSV files should have headers matching the food properties.
          </p>
        </div>
        
        <button
          onClick={handleImport}
          disabled={uploading || !file}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          {uploading ? 'Importing...' : 'Import Foods'}
        </button>
      </div>
      
      {/* Export Section */}
      <div className="bg-white p-6 rounded shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Export Database</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="json"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">JSON</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">CSV</span>
            </label>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Export Database
        </button>
      </div>
      
      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Danger Zone</h2>
        
        <div className="mb-4">
          <p className="text-red-600 mb-2">
            The following actions are destructive and cannot be undone. Use with extreme caution.
          </p>
        </div>
        
        <button
          onClick={handleClearDatabase}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Clear Entire Database
        </button>
      </div>
    </div>
  );
};

export default AdminPage; 
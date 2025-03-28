# Food Database Setup and Management Guide

This guide explains how to set up and manage the food database for the Calorie Tracker application.

## Table of Contents

1. [Firebase Setup](#firebase-setup)
2. [Database Structure](#database-structure)
3. [Managing the Database](#managing-the-database)
4. [Importing Foods](#importing-foods)
5. [Exporting Foods](#exporting-foods)
6. [User Contributions](#user-contributions)
7. [Troubleshooting](#troubleshooting)

## Firebase Setup

The application uses Firebase Firestore as its database. Follow these steps to set up Firebase:

1. **Create a Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Google Analytics if desired

2. **Set Up Firestore Database**:
   - In your Firebase project, go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Start in production mode
   - Choose a location closest to your users

3. **Set Up Authentication**:
   - Go to "Authentication" in the left sidebar
   - Click "Get started"
   - Enable Email/Password authentication
   - Optionally enable other authentication methods (Google, Facebook, etc.)

4. **Get Firebase Configuration**:
   - Go to Project Settings (gear icon in the top left)
   - Scroll down to "Your apps" section
   - If you haven't added a web app yet, click the web icon (</>) to add one
   - Register your app with a nickname
   - Copy the firebaseConfig object

5. **Update Configuration in Your App**:
   - Open `src/firebase.js` in your project
   - Replace the existing firebaseConfig object with your own

6. **Set Up Security Rules**:
   - Go to "Firestore Database" > "Rules" tab
   - Update the rules to secure your database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read all shared foods
    match /sharedFoods/{document=**} {
      allow read: if request.auth != null;
      
      // Allow users to create shared foods
      allow create: if request.auth != null && 
                     request.resource.data.createdBy == request.auth.uid;
      
      // Allow users to update or delete only their own foods
      allow update, delete: if request.auth != null && 
                             resource.data.createdBy == request.auth.uid;
    }
    
    // Add rules for other collections as needed
  }
}
```

7. **Deploy Rules**:
   - Click "Publish" to deploy your security rules

## Database Structure

The application uses three types of food databases:

1. **Australian Food Database** (static, stored in `src/data/australianFoodDatabase.js`)
2. **US Food Database** (static, stored in `src/data/usFoodDatabase.js`)
3. **Shared Food Database** (dynamic, stored in Firebase Firestore)

The Firestore database has the following collections:

- **sharedFoods**: Contains user-contributed food items with the following fields:
  - `itemName`: Name of the food item
  - `category`: Food category
  - `weight`: Serving size (e.g., "100g", "1 cup")
  - `calories`: Calories per serving
  - `protein`: Protein content in grams
  - `fat`: Fat content in grams
  - `carbs`: Carbohydrate content in grams
  - `fiber`: Fiber content in grams
  - `sugar`: Sugar content in grams
  - `sodium`: Sodium content in milligrams
  - `description`: Optional description
  - `createdBy`: User ID of the creator
  - `createdByName`: Display name of the creator
  - `createdAt`: Timestamp when the food was added
  - `likes`: Number of likes
  - `usageCount`: Number of times the food has been used

## Managing the Database

The application includes an admin page for managing the food database:

1. **Access the Admin Page**:
   - Navigate to `/admin` in your application
   - Only users with admin privileges can access this page

2. **Set Admin Privileges**:
   - Open `src/pages/AdminPage.jsx`
   - Update the `adminEmails` array with the email addresses of your admin users:
   ```javascript
   const adminEmails = ['your-email@example.com', 'another-admin@example.com'];
   ```

3. **Admin Features**:
   - View database statistics
   - Import foods from JSON or CSV files
   - Export the entire database
   - Clear the database (use with caution!)

## Importing Foods

You can import foods in bulk using JSON or CSV files:

1. **Prepare Your Import File**:
   - Use the sample files in the `public` folder as templates:
     - `sample-food-import.json`
     - `sample-food-import.csv`
   - Ensure your file has the required fields (itemName, calories)

2. **Import Process**:
   - Go to the Admin page
   - In the "Import Foods" section, click "Choose File"
   - Select your JSON or CSV file
   - Click "Import Foods"
   - Wait for the import to complete

3. **JSON Format Example**:
```json
[
  {
    "itemName": "Homemade Granola",
    "category": "Breakfast Cereal",
    "weight": "100g",
    "calories": 450,
    "protein": 10,
    "fat": 20,
    "carbs": 55,
    "fiber": 8,
    "sugar": 15,
    "sodium": 10,
    "description": "Homemade granola with oats, nuts, and honey"
  }
]
```

4. **CSV Format Example**:
```
itemName,category,weight,calories,protein,fat,carbs,fiber,sugar,sodium,description
"Homemade Granola","Breakfast Cereal","100g",450,10,20,55,8,15,10,"Homemade granola with oats, nuts, and honey"
```

## Exporting Foods

You can export the entire shared food database:

1. **Export Process**:
   - Go to the Admin page
   - In the "Export Database" section, select the format (JSON or CSV)
   - Click "Export Database"
   - The file will be downloaded to your computer

2. **Using Exported Data**:
   - Use the exported data for backup purposes
   - Modify the data and re-import it
   - Share the data with other instances of the application

## User Contributions

Users can contribute to the shared food database:

1. **Adding Foods**:
   - Users navigate to the Food Database page
   - Click the "Add Food" tab
   - Fill out the food details form
   - Click "Add to Community Database"

2. **Liking Foods**:
   - Users can like foods in the shared database
   - This helps highlight popular food items

3. **Usage Tracking**:
   - The application tracks how many times each shared food is used
   - This helps identify the most useful food entries

## Troubleshooting

Common issues and solutions:

1. **Import Errors**:
   - Ensure your JSON is valid (use a JSON validator)
   - Check that CSV headers match the expected field names
   - Verify that required fields (itemName, calories) are present

2. **Firebase Permissions**:
   - Check that your Firebase security rules are correctly set up
   - Ensure users are authenticated before accessing the database

3. **Admin Access Issues**:
   - Verify that your email is in the `adminEmails` array
   - Make sure you're logged in with the correct account

4. **Database Size Limits**:
   - Firestore has limits on document size (1MB) and batch operations (500)
   - For very large imports, split your data into smaller batches

For additional help, refer to the [Firebase documentation](https://firebase.google.com/docs) or contact the application administrator. 
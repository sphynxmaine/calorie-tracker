# Firebase Setup Guide

This guide will help you set up Firebase for the Calorie Tracker application, including how to use the Firebase emulators for local development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Using Firebase Emulators](#using-firebase-emulators)
4. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later)
- [Firebase CLI](https://firebase.google.com/docs/cli) (install with `npm install -g firebase-tools`)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired

### 2. Set Up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in production mode
4. Choose a location closest to your users

### 3. Set Up Authentication

1. Go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable Email/Password authentication
4. Optionally enable other authentication methods (Google, Facebook, etc.)

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon in the top left)
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to add a web app if you haven't already
4. Register your app with a nickname
5. Copy the firebaseConfig object

### 5. Update Configuration in Your App

The Firebase configuration is already set up in `src/firebase.js`. Replace the existing firebaseConfig object with your own:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Using Firebase Emulators

Firebase Emulators allow you to run Firebase services locally on your machine, which is great for development and testing.

### 1. Install Firebase CLI

If you haven't already, install the Firebase CLI:

```bash
npm install -g firebase-tools
```

### 2. Log in to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in Your Project

The project is already initialized with Firebase. The configuration files are:

- `firebase.json`: Configuration for Firebase services and emulators
- `firestore.rules`: Security rules for Firestore
- `firestore.indexes.json`: Indexes for Firestore queries

### 4. Start the Emulators

You can start the emulators using the npm script:

```bash
npm run emulators
```

This will start the following emulators:
- Auth Emulator on port 9099
- Firestore Emulator on port 8080
- Emulator UI on port 4000

### 5. Using the Emulators

When you run the application with `npm run dev`, it will automatically connect to the emulators if they are running and you're in development mode.

You can access the Emulator UI at http://localhost:4000 to view and manage your emulated Firebase services.

## Troubleshooting

### Application Stuck on "Initializing Application"

If the application is stuck on the initialization screen:

1. Check if the Firebase emulators are running
2. Open the browser console (F12) to see any error messages
3. Click the "Skip Initialization" button to bypass the database initialization

### Firebase Emulator Connection Issues

If you're having trouble connecting to the Firebase emulators:

1. Make sure the emulators are running (`npm run emulators`)
2. Check that the ports (9099 for Auth, 8080 for Firestore) are not being used by other applications
3. If you're using a firewall, make sure it allows connections to these ports

### Authentication Issues

If you're having trouble with authentication:

1. Check that you've enabled Email/Password authentication in the Firebase console
2. If using the emulators, make sure the Auth emulator is running
3. Check the browser console for any error messages

### Firestore Issues

If you're having trouble with Firestore:

1. Check that you've created a Firestore database in the Firebase console
2. If using the emulators, make sure the Firestore emulator is running
3. Check the browser console for any error messages
4. Check the Firestore rules to make sure they allow the operations you're trying to perform

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth) 
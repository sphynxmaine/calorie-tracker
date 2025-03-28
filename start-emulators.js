// start-emulators.js
// Script to help users start the Firebase emulators

const { spawn } = require('child_process');
const readline = require('readline');

console.log('Starting Firebase emulators...');
console.log('This will start the Auth and Firestore emulators for local development.');

// Check if Firebase CLI is installed
const checkFirebaseCLI = spawn('firebase', ['--version']);

checkFirebaseCLI.on('error', (error) => {
  console.error('Error: Firebase CLI is not installed or not in PATH.');
  console.log('Please install Firebase CLI with:');
  console.log('npm install -g firebase-tools');
  console.log('Then run this script again.');
  process.exit(1);
});

checkFirebaseCLI.stdout.on('data', (data) => {
  console.log(`Firebase CLI version: ${data.toString().trim()}`);
  
  // Start the emulators
  const emulators = spawn('firebase', ['emulators:start'], {
    stdio: 'inherit' // This will show the emulator output in the console
  });
  
  emulators.on('error', (error) => {
    console.error('Error starting emulators:', error);
    process.exit(1);
  });
  
  emulators.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Emulators exited with code ${code}`);
    }
  });
  
  // Handle CTRL+C to gracefully shut down emulators
  process.on('SIGINT', () => {
    console.log('Shutting down emulators...');
    emulators.kill('SIGINT');
    process.exit(0);
  });
});

// Add the script to package.json scripts
const fs = require('fs');
const path = require('path');

try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = require(packageJsonPath);
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // Add the emulators script if it doesn't exist
  if (!packageJson.scripts.emulators) {
    packageJson.scripts.emulators = 'node start-emulators.js';
    
    // Write the updated package.json
    fs.writeFileSync(
      packageJsonPath, 
      JSON.stringify(packageJson, null, 2)
    );
    
    console.log('Added "emulators" script to package.json');
    console.log('You can now run "npm run emulators" to start the Firebase emulators');
  }
} catch (error) {
  console.warn('Could not update package.json:', error);
  console.log('You can still start the emulators with:');
  console.log('firebase emulators:start');
} 
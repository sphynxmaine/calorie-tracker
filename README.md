# CalorieTracker App

A comprehensive web application for tracking daily calorie intake, monitoring weight progress, and managing nutrition goals.

## 🔑 Key Features

- **Food Diary**: Log daily food consumption with automatic calorie calculation
- **Weight Tracking**: Monitor weight progress over time with visual graphs
- **Customizable Food Database**: Contribute your own foods to a growing database
- **Meal Planning**: Plan meals in advance with nutritional information
- **Multi-country Food Data**: Support for food databases from multiple countries
- **Dark/Light Mode**: Personalized UI theme preferences

## 🚀 Recent Improvements

### Data Standardization
- Created standardized food data model for consistent food display across the application
- Implemented utility functions for data formatting and validation
- Fixed "unknown food" display issues in the dashboard

### UX Improvements
- Enhanced mobile navigation for better cross-page experience
- Added recent foods section for quick access to commonly used items
- Improved weight logging with better validation and feedback
- Added country selection for food contributions
- Enhanced search functionality with performance optimizations

### Technical Improvements
- Implemented data caching for faster loading and better performance
- Created reusable components for consistent UI
- Added comprehensive error handling
- Improved Firebase data structure and queries
- Fixed critical bugs in weight logging and dashboard display

## 📋 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Firebase account with Firestore database
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/calorie-tracker.git
cd calorie-tracker
```

2. Install dependencies
```bash
npm install
```

3. Create a Firebase project and enable Firestore
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore database
   - Create a web app in your Firebase project
   - Copy your Firebase configuration

4. Create a `.env` file in the root directory with your Firebase configuration
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

5. Start the development server
```bash
npm run dev
```

## 🔧 Firebase Setup

### Required Collections

The app uses the following Firestore collections:
- `users`: User profile information
- `foodEntries`: Daily food diary entries
- `weightLogs`: User weight tracking data
- `customFoods`: User-created foods
- `userFoods`: Community contributed foods

### Firebase Indexes

You'll need the following indexes for proper functionality:

#### Collection: foodEntries
- Composite index:
  - Fields: `userId` (Ascending), `date` (Descending)
  - Query scope: Collection

#### Collection: weightLogs
- Composite index:
  - Fields: `userId` (Ascending), `date` (Descending)
  - Query scope: Collection

#### Collection: userFoods
- Composite index:
  - Fields: `approved` (Ascending), `name` (Ascending)
  - Query scope: Collection

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices. Key mobile features include:
- Touch-friendly interface
- Bottom navigation bar
- Optimized forms and inputs for mobile screens
- Fast loading times for mobile data connections

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: React Context API
- **Routing**: React Router
- **Charts**: Chart.js
- **Deployment**: Vercel/Netlify

## 🔒 Authentication

The app supports:
- Email/password authentication
- Google sign-in
- Anonymous accounts for trying the app

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please open an issue on the GitHub repository or contact the maintainers directly.

---

Built with ❤️ by the CalorieTracker Team

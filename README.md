# Shop Buddy - Smart Shopping Assistant

Shop Buddy is a real-time multi-user smart shopping assistant app built with React Native, Socket.IO, and Express. It helps users manage their shopping budget, track item prices, and collaborate on shopping sessions in real time.

## Features

- **Real-time multi-user collaboration** - Multiple users can join the same shopping session
- **Intelligent price tracking** - Track item prices and get notified of price changes
- **Budget management** - Set a budget for your shopping session and get alerts when approaching or exceeding it
- **Smart recommendations** - Get recommendations for cheaper alternatives when over budget
- **Barcode scanning** - Scan product barcodes to quickly add items to your cart
- **Session sharing** - Share your session ID with others to collaborate

## Project Structure

The project is divided into two main parts:

### Frontend (React Native App)

The frontend is a React Native app built with Expo. It handles the user interface, local data storage, and communicates with the backend via Socket.IO.

```
frontend/
├── App.js              # Main app component with navigation
├── screens/            # Screen components
│   ├── HomeScreen.js   # Home screen for creating/joining sessions
│   ├── SessionScreen.js # Shopping session screen
│   └── ScannerScreen.js # Barcode scanner screen
├── components/         # Reusable UI components
├── utils/              # Utility functions and agents
│   ├── priceAgent.js   # Manages product prices
│   ├── budgetAgent.js  # Manages budget and recommendations
│   ├── socketAgent.js  # Manages Socket.IO connection
│   ├── config.js       # App configuration
│   └── testAgents.js   # Test utilities for agents
└── assets/             # Static assets
```

### Backend (Express + Socket.IO Server)

The backend is an Express server with Socket.IO integration. It manages the shopping sessions, user connections, and real-time updates.

```
backend/
├── index.js            # Main server file
└── test.js             # Server tests
```

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Android/iOS simulator or physical device for testing

## Getting Started

### Setting up the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

### Setting up the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the backend URL in `utils/config.js` to match your local IP address:
   ```javascript
   export const BACKEND_URL = 'http://YOUR_IP_ADDRESS:3000';
   ```

4. Start the Expo development server:
   ```
   npm start
   ```

5. Use the Expo Go app on your device to scan the QR code or run on an emulator.

## Testing

### Backend Tests

Run backend tests with:
```
cd backend
npm test
```

### Frontend Agent Tests

Run frontend agent tests from the Expo development console or create a test screen in the app to run:
```javascript
import { runAllTests } from './utils/testAgents';

// Run all tests
runAllTests().then(results => console.log(results));
```

## Usage

1. **Start the app** - Launch the app on your device.
2. **Create or join a session** - On the home screen, enter your name and either create a new session or join an existing one by entering a session ID.
3. **Add items** - Use the "Scan Item" button to scan a barcode or the "Add Item" button to manually add an item.
4. **Share your session** - Share your session ID with others so they can join your shopping session.
5. **Track your budget** - Set a budget for your shopping trip and the app will alert you when approaching or exceeding it.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Socket.IO](https://socket.io/)
- [Express](https://expressjs.com/) 
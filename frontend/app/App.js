import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SessionScreen from '../screens/SessionScreen';
import ScannerScreen from '../screens/ScannerScreen';
import TestScreen from '../screens/TestScreen';

// Create navigation stack
const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Shop Buddy' }} 
          />
          <Stack.Screen 
            name="Session" 
            component={SessionScreen} 
            options={({ route }) => ({ title: `Session: ${route.params.sessionId}` })} 
          />
          <Stack.Screen 
            name="Scanner" 
            component={ScannerScreen} 
            options={{ title: 'Scan Item' }} 
          />
          <Stack.Screen 
            name="Test" 
            component={TestScreen} 
            options={{ title: 'Test Mode' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

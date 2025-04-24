import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { BACKEND_URL } from '../utils/config';

const HomeScreen = ({ navigation }) => {
  const [sessionId, setSessionId] = useState('');
  const [username, setUsername] = useState('');
  const [budget, setBudget] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Load username and fetch sessions when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load username
        const savedUsername = await AsyncStorage.getItem('username');
        if (savedUsername) {
          setUsername(savedUsername);
        }
        
        // Fetch active sessions
        fetchSessions();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Fetch active sessions from the backend
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('Failed to fetch sessions:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle session selection from dropdown
  const handleSessionSelect = (value) => {
    setSelectedSession(value);
    if (value) {
      setSessionId(value.id);
      
      // If the session has a budget, pre-fill it
      if (value.budget > 0) {
        setBudget(value.budget.toString());
      }
    } else {
      setSessionId('');
    }
  };

  // Generate a random session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Save username to AsyncStorage
  const saveUsername = async (name) => {
    try {
      await AsyncStorage.setItem('username', name);
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };

  // Handle joining a session
  const handleJoinSession = async () => {
    if (!sessionId.trim()) {
      Alert.alert('Error', 'Please enter or select a session ID');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    // Save username for next time
    await saveUsername(username);

    // Navigate to the session screen
    navigation.navigate('Session', {
      sessionId: sessionId.toUpperCase(),
      username,
      budget: parseFloat(budget) || 0,
      isNewSession: false
    });
  };

  // Handle creating a new session
  const handleCreateSession = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    // Generate a new session ID
    const newSessionId = generateSessionId();

    // Save username for next time
    await saveUsername(username);

    // Navigate to the session screen
    navigation.navigate('Session', {
      sessionId: newSessionId,
      username,
      budget: parseFloat(budget) || 0,
      isNewSession: true
    });
  };

  // Render session picker and/or input
  const renderSessionInput = () => {
    // Show loading indicator when fetching sessions
    if (loading) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Session</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        </View>
      );
    }

    // If there are active sessions, show the dropdown
    if (sessions.length > 0) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Session</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSession}
              onValueChange={handleSessionSelect}
              style={styles.picker}
            >
              <Picker.Item label="Select a session..." value={null} />
              {sessions.map(session => (
                <Picker.Item 
                  key={session.id} 
                  label={`${session.id} (by ${session.creator}) ${session.budget > 0 ? `- Budget: $${session.budget}` : ''} - Users: ${session.userCount}`} 
                  value={session} 
                />
              ))}
            </Picker>
          </View>
          
          {/* Allow manual entry if dropdown selection is null */}
          {!selectedSession && (
            <View style={styles.manualEntryContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.divider} />
            </View>
          )}
          
          {!selectedSession && (
            <TextInput
              style={[styles.input, styles.manualInput]}
              value={sessionId}
              onChangeText={text => setSessionId(text.toUpperCase())}
              placeholder="Enter session ID manually"
              autoCapitalize="characters"
            />
          )}
        </View>
      );
    }
    
    // If no sessions, show only the text input
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Session ID (to join existing)</Text>
        <TextInput
          style={styles.input}
          value={sessionId}
          onChangeText={text => setSessionId(text.toUpperCase())}
          placeholder="Enter session ID"
          autoCapitalize="characters"
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Shop Buddy</Text>
          <Text style={styles.subtitle}>Your Smart Shopping Assistant</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your name"
              autoCapitalize="words"
            />
          </View>
          
          {renderSessionInput()}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Budget (optional)</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="Enter your budget"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.joinButton]}
              onPress={handleJoinSession}
            >
              <Text style={styles.buttonText}>Join Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateSession}
            >
              <Text style={styles.buttonText}>Create New Session</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchSessions}
          >
            <Text style={styles.refreshButtonText}>Refresh Sessions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => navigation.navigate('Test')}
          >
            <Text style={styles.testButtonText}>Run Tests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#212529',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 5,
  },
  picker: {
    width: '100%',
    height: 50,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#007AFF',
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  testButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#6c757d',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
  },
  loadingText: {
    marginLeft: 10,
    color: '#6c757d',
    fontSize: 14,
  },
  manualEntryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  orText: {
    marginHorizontal: 10,
    color: '#6c757d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ced4da',
    marginHorizontal: 5,
  },
  manualInput: {
    marginTop: 0,
  },
});

export default HomeScreen; 
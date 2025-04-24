import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { usePriceAgent } from '../utils/priceAgent';
import { useBudgetAgent } from '../utils/budgetAgent';
import { BACKEND_URL, SOCKET_OPTIONS } from '../utils/config';
import ItemComponent from '../components/ItemComponent';
import BudgetWarning from '../components/BudgetWarning';

const SessionScreen = ({ route, navigation }) => {
  const { sessionId, username, budget, isNewSession } = route.params;
  
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sessionBudget, setSessionBudget] = useState(budget);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '1' });
  
  const socketRef = useRef(null);
  const isFocused = useIsFocused();
  
  const { checkPrice, suggestPriceUpdate } = usePriceAgent();
  const { checkBudget, suggestAlternatives } = useBudgetAgent(sessionBudget);

  // Initialize socket connection
  useEffect(() => {
    if (!isFocused) return;
    
    // Create socket connection
    const newSocket = io(BACKEND_URL, SOCKET_OPTIONS);
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      
      // Join session room
      newSocket.emit('joinSession', { sessionId, username });
    });
    
    newSocket.on('sessionJoined', (session) => {
      console.log('Joined session:', session);
      setItems(session.items);
      setUsers(session.users);
      setTotalAmount(session.totalAmount);
      
      if (isNewSession && budget > 0) {
        newSocket.emit('setBudget', { sessionId, budget });
      } else if (session.budget > 0) {
        setSessionBudget(session.budget);
      }
      
      setLoading(false);
    });
    
    newSocket.on('userJoined', (user) => {
      console.log('User joined:', user);
      setUsers(prevUsers => [...prevUsers, user]);
      Alert.alert('New User', `${user.username} joined the session`);
    });
    
    newSocket.on('userLeft', (user) => {
      console.log('User left:', user);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      Alert.alert('User Left', `${user.username} left the session`);
    });
    
    newSocket.on('itemAdded', ({ item, totalAmount }) => {
      console.log('Item added:', item);
      setItems(prevItems => [...prevItems, item]);
      setTotalAmount(totalAmount);
      
      // Check budget after item is added
      const budgetFeedback = checkBudget(totalAmount, sessionBudget);
      if (budgetFeedback.warning) {
        Alert.alert('Budget Warning', budgetFeedback.message);
      }
    });
    
    newSocket.on('itemRemoved', ({ itemId, totalAmount }) => {
      console.log('Item removed:', itemId);
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      setTotalAmount(totalAmount);
    });
    
    newSocket.on('itemUpdated', ({ itemId, updates, totalAmount }) => {
      console.log('Item updated:', itemId, updates);
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
      setTotalAmount(totalAmount);
    });
    
    newSocket.on('budgetSet', ({ budget }) => {
      console.log('Budget set:', budget);
      setSessionBudget(budget);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the server');
    });
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveSession', { sessionId });
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, username, budget, isNewSession, isFocused]);
  
  // Handle scanning an item
  const handleScanItem = useCallback(() => {
    navigation.navigate('Scanner', {
      onBarCodeScanned: handleItemScanned,
    });
  }, [navigation]);
  
  // Handle scanned item
  const handleItemScanned = useCallback(async (barcode) => {
    try {
      // Check if item exists in our local database
      const existingItem = await checkPrice(barcode);
      
      if (existingItem) {
        // Item exists, ask if price has changed
        Alert.alert(
          'Item Found',
          `${existingItem.name} - $${existingItem.price}\nHas the price changed?`,
          [
            {
              text: 'No, Add to Cart',
              onPress: () => {
                if (socket) {
                  socket.emit('addItem', {
                    sessionId,
                    item: {
                      name: existingItem.name,
                      price: existingItem.price,
                      barcode,
                      quantity: 1,
                    },
                  });
                }
              },
            },
            {
              text: 'Yes, Update Price',
              onPress: () => {
                setNewItem({
                  name: existingItem.name,
                  price: '',
                  quantity: '1',
                  barcode,
                });
                setModalVisible(true);
              },
            },
          ]
        );
      } else {
        // Item doesn't exist, add new item details
        setNewItem({
          name: '',
          price: '',
          quantity: '1',
          barcode,
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error handling scanned item:', error);
      Alert.alert('Error', 'Failed to process scanned item');
    }
  }, [socket, sessionId, checkPrice]);
  
  // Handle manual item addition
  const handleAddItem = useCallback(() => {
    setNewItem({ name: '', price: '', quantity: '1' });
    setModalVisible(true);
  }, []);
  
  // Handle saving new item
  const handleSaveItem = useCallback(() => {
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    
    if (!newItem.price.trim() || isNaN(parseFloat(newItem.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    
    if (!newItem.quantity.trim() || isNaN(parseInt(newItem.quantity))) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    // Create item to add
    const itemToAdd = {
      name: newItem.name,
      price: parseFloat(newItem.price),
      quantity: parseInt(newItem.quantity),
      barcode: newItem.barcode || null,
    };
    
    // If we have a price agent suggestion, save the item details
    if (newItem.barcode) {
      suggestPriceUpdate(newItem.barcode, itemToAdd.name, itemToAdd.price);
    }
    
    // Send to server
    if (socket) {
      socket.emit('addItem', {
        sessionId,
        item: itemToAdd,
      });
    }
    
    // Close modal
    setModalVisible(false);
  }, [newItem, socket, sessionId, suggestPriceUpdate]);
  
  // Handle removing an item
  const handleRemoveItem = useCallback((item) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (socket) {
              socket.emit('removeItem', {
                sessionId,
                itemId: item.id,
              });
            }
          },
        },
      ]
    );
  }, [socket, sessionId]);
  
  // Handle increasing item quantity
  const handleIncreaseQuantity = useCallback((item) => {
    if (socket) {
      const updatedQuantity = item.quantity + 1;
      socket.emit('updateItem', {
        sessionId,
        itemId: item.id,
        updates: {
          quantity: updatedQuantity
        }
      });
    }
  }, [socket, sessionId]);
  
  // Handle decreasing item quantity
  const handleDecreaseQuantity = useCallback((item) => {
    if (socket) {
      if (item.quantity > 1) {
        // If quantity will still be greater than 0
        const updatedQuantity = item.quantity - 1;
        socket.emit('updateItem', {
          sessionId,
          itemId: item.id,
          updates: {
            quantity: updatedQuantity
          }
        });
      } else {
        // If quantity would become 0, ask for confirmation to remove the item
        Alert.alert(
          'Remove Item',
          `Do you want to remove ${item.name} from your cart?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                socket.emit('removeItem', {
                  sessionId,
                  itemId: item.id,
                });
              },
            },
          ]
        );
      }
    }
  }, [socket, sessionId]);
  
  // Handle getting budget recommendations
  const handleGetRecommendations = useCallback(() => {
    const recommendations = suggestAlternatives(items);
    if (recommendations.length > 0) {
      Alert.alert(
        'Budget Recommendations',
        recommendations.join('\n\n')
      );
    } else {
      Alert.alert(
        'No Recommendations',
        'Sorry, we don\'t have any recommendations at this time.'
      );
    }
  }, [items, suggestAlternatives]);
  
  // Render each item in the list
  const renderItem = ({ item }) => (
    <ItemComponent
      item={item}
      onRemove={handleRemoveItem}
      onIncreaseQuantity={handleIncreaseQuantity}
      onDecreaseQuantity={handleDecreaseQuantity}
    />
  );
  
  // Render recommendation if over budget
  const renderBudgetRecommendation = () => {
    if (sessionBudget > 0 && totalAmount > sessionBudget) {
      return (
        <BudgetWarning
          message={`You are $${(totalAmount - sessionBudget).toFixed(2)} over budget!`}
          onGetRecommendations={handleGetRecommendations}
        />
      );
    }
    return null;
  };
  
  // Share session
  const handleShareSession = () => {
    Alert.alert(
      'Share Session',
      `Share this session ID with others:\n\n${sessionId}`,
      [{ text: 'Copy to Clipboard', onPress: () => {} }, { text: 'OK' }]
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Connecting to session...</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionId}>Session ID: {sessionId}</Text>
              <TouchableOpacity onPress={handleShareSession}>
                <Text style={styles.shareButton}>Share</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.userList}>
              <Text style={styles.usersTitle}>
                Users Online: {users.length}
              </Text>
              <Text style={styles.userNames}>
                {users.map(user => user.username).join(', ')}
              </Text>
            </View>
            
            <View style={styles.budgetContainer}>
              <Text style={styles.budgetTitle}>
                Total: ${totalAmount.toFixed(2)}
              </Text>
              {sessionBudget > 0 && (
                <Text
                  style={[
                    styles.budgetAmount,
                    totalAmount > sessionBudget && styles.overBudget,
                  ]}
                >
                  Budget: ${sessionBudget.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
          
          {renderBudgetRecommendation()}
          
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.itemList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No items yet. Scan or add items to get started.
                </Text>
              </View>
            }
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.scanButton]}
              onPress={handleScanItem}
            >
              <Text style={styles.buttonText}>Scan Item</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAddItem}
            >
              <Text style={styles.buttonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {/* New Item Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {newItem.barcode ? 'Item Details' : 'Add New Item'}
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Item Name</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.name}
                    onChangeText={text => setNewItem({ ...newItem, name: text })}
                    placeholder="Enter item name"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.price}
                    onChangeText={text => setNewItem({ ...newItem, price: text })}
                    placeholder="Enter price"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.quantity}
                    onChangeText={text => setNewItem({ ...newItem, quantity: text })}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveItem}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  shareButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  userList: {
    marginBottom: 8,
  },
  usersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  userNames: {
    fontSize: 14,
    color: '#212529',
    marginTop: 2,
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  overBudget: {
    color: '#dc3545',
  },
  itemList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#28a745',
    marginLeft: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#212529',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default SessionScreen; 
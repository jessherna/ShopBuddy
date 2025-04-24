import { io } from 'socket.io-client';
import { BACKEND_URL, SOCKET_OPTIONS } from './config';

/**
 * SocketAgent handles WebSocket connections to the server
 * It manages real-time communication for shopping sessions
 */
class SocketAgent {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.username = null;
    this.listeners = {};
    this.isConnected = false;
  }

  // Connect to the server
  connect() {
    if (this.socket) {
      // Already connected, return the existing socket
      return this.socket;
    }

    // Create a new socket connection
    this.socket = io(BACKEND_URL, SOCKET_OPTIONS);

    // Setup connection event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      
      // If we have session info, automatically join the session
      if (this.sessionId && this.username) {
        this.joinSession(this.sessionId, this.username);
      }
      
      // Notify listeners
      this._notifyListeners('connect');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      
      // Notify listeners
      this._notifyListeners('disconnect');
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      
      // Notify listeners
      this._notifyListeners('error', error);
    });
    
    return this.socket;
  }

  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      // Leave the current session before disconnecting
      if (this.sessionId) {
        this.leaveSession();
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a shopping session
  joinSession(sessionId, username) {
    if (!this.socket) {
      this.connect();
    }
    
    this.sessionId = sessionId;
    this.username = username;
    
    // Only send join event if we're connected
    if (this.isConnected) {
      this.socket.emit('joinSession', { sessionId, username });
    }
    
    // Setup session event handlers
    this.socket.on('sessionJoined', (session) => {
      this._notifyListeners('sessionJoined', session);
    });
    
    this.socket.on('userJoined', (user) => {
      this._notifyListeners('userJoined', user);
    });
    
    this.socket.on('userLeft', (user) => {
      this._notifyListeners('userLeft', user);
    });
    
    this.socket.on('itemAdded', (data) => {
      this._notifyListeners('itemAdded', data);
    });
    
    this.socket.on('itemRemoved', (data) => {
      this._notifyListeners('itemRemoved', data);
    });
    
    this.socket.on('itemUpdated', (data) => {
      this._notifyListeners('itemUpdated', data);
    });
    
    this.socket.on('budgetSet', (data) => {
      this._notifyListeners('budgetSet', data);
    });
  }

  // Leave the current session
  leaveSession() {
    if (this.socket && this.sessionId) {
      this.socket.emit('leaveSession', { sessionId: this.sessionId });
      this.sessionId = null;
    }
  }

  // Add an item to the session
  addItem(item) {
    if (!this.socket || !this.sessionId) {
      return false;
    }
    
    this.socket.emit('addItem', {
      sessionId: this.sessionId,
      item
    });
    
    return true;
  }

  // Remove an item from the session
  removeItem(itemId) {
    if (!this.socket || !this.sessionId) {
      return false;
    }
    
    this.socket.emit('removeItem', {
      sessionId: this.sessionId,
      itemId
    });
    
    return true;
  }

  // Update an item in the session
  updateItem(itemId, updates) {
    if (!this.socket || !this.sessionId) {
      return false;
    }
    
    this.socket.emit('updateItem', {
      sessionId: this.sessionId,
      itemId,
      updates
    });
    
    return true;
  }

  // Set the session budget
  setBudget(budget) {
    if (!this.socket || !this.sessionId) {
      return false;
    }
    
    this.socket.emit('setBudget', {
      sessionId: this.sessionId,
      budget
    });
    
    return true;
  }

  // Add event listener
  addListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
  }

  // Remove event listener
  removeListener(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Notify listeners of an event
  _notifyListeners(event, data) {
    if (!this.listeners[event]) return;
    
    for (const callback of this.listeners[event]) {
      callback(data);
    }
  }
}

// Create a singleton instance
const socketAgent = new SocketAgent();

export default socketAgent;

// Test function for the SocketAgent
export const testSocketAgent = () => {
  // Connect to the server
  const socket = socketAgent.connect();
  console.assert(socket !== null, 'Should create a socket connection');
  
  // Test event listeners
  let connectCalled = false;
  socketAgent.addListener('connect', () => {
    connectCalled = true;
  });
  
  // Test emitting events
  const sessionId = 'TEST123';
  const username = 'TestUser';
  
  socketAgent.joinSession(sessionId, username);
  console.assert(socketAgent.sessionId === sessionId, 'Session ID should be set');
  console.assert(socketAgent.username === username, 'Username should be set');
  
  // Cleanup
  socketAgent.removeListener('connect', () => {});
  socketAgent.disconnect();
  
  return 'SocketAgent tests completed!';
}; 
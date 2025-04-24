const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify your frontend URL
    methods: ['GET', 'POST']
  }
});

// Store active sessions
const sessions = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join or create a shopping session
  socket.on('joinSession', ({ sessionId, username }) => {
    // If session doesn't exist, create it
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        users: [],
        items: [],
        totalAmount: 0,
        budget: 0,
        creator: username,
        createdAt: new Date().toISOString()
      });
    }
    
    const session = sessions.get(sessionId);
    
    // Add user to session
    session.users.push({
      id: socket.id,
      username
    });
    
    // Join the socket room
    socket.join(sessionId);
    
    // Send current session data to the new user
    socket.emit('sessionJoined', session);
    
    // Notify others in the session
    socket.to(sessionId).emit('userJoined', { id: socket.id, username });
  });
  
  // Add item to shopping session
  socket.on('addItem', ({ sessionId, item }) => {
    if (!sessions.has(sessionId)) return;
    
    const session = sessions.get(sessionId);
    
    // Add item to session
    session.items.push({
      ...item,
      id: Date.now().toString(),
      addedBy: socket.id
    });
    
    // Update total amount
    session.totalAmount += parseFloat(item.price) * item.quantity;
    
    // Emit to all users in the session
    io.to(sessionId).emit('itemAdded', {
      item: session.items[session.items.length - 1],
      totalAmount: session.totalAmount
    });
  });
  
  // Update item in shopping session
  socket.on('updateItem', ({ sessionId, itemId, updates }) => {
    if (!sessions.has(sessionId)) return;
    
    const session = sessions.get(sessionId);
    const itemIndex = session.items.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      // Calculate price difference
      const oldPrice = session.items[itemIndex].price * session.items[itemIndex].quantity;
      
      // Update the item
      session.items[itemIndex] = {
        ...session.items[itemIndex],
        ...updates
      };
      
      // Calculate new price and update total
      const newPrice = session.items[itemIndex].price * session.items[itemIndex].quantity;
      session.totalAmount = session.totalAmount - oldPrice + newPrice;
      
      // Emit to all users in the session
      io.to(sessionId).emit('itemUpdated', {
        itemId,
        updates,
        totalAmount: session.totalAmount
      });
    }
  });
  
  // Remove item from shopping session
  socket.on('removeItem', ({ sessionId, itemId }) => {
    if (!sessions.has(sessionId)) return;
    
    const session = sessions.get(sessionId);
    const itemIndex = session.items.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      // Calculate price to subtract
      const priceToSubtract = session.items[itemIndex].price * session.items[itemIndex].quantity;
      
      // Remove the item
      session.items.splice(itemIndex, 1);
      
      // Update total amount
      session.totalAmount -= priceToSubtract;
      
      // Emit to all users in the session
      io.to(sessionId).emit('itemRemoved', {
        itemId,
        totalAmount: session.totalAmount
      });
    }
  });
  
  // Set budget for shopping session
  socket.on('setBudget', ({ sessionId, budget }) => {
    if (!sessions.has(sessionId)) return;
    
    const session = sessions.get(sessionId);
    session.budget = parseFloat(budget);
    
    // Emit to all users in the session
    io.to(sessionId).emit('budgetSet', {
      budget: session.budget
    });
  });
  
  // Leave session
  socket.on('leaveSession', ({ sessionId }) => {
    if (!sessions.has(sessionId)) return;
    
    const session = sessions.get(sessionId);
    const userIndex = session.users.findIndex(user => user.id === socket.id);
    
    if (userIndex !== -1) {
      const user = session.users[userIndex];
      session.users.splice(userIndex, 1);
      
      // Remove session if empty
      if (session.users.length === 0) {
        sessions.delete(sessionId);
      } else {
        // Notify others that user left
        socket.to(sessionId).emit('userLeft', { id: socket.id, username: user.username });
      }
      
      socket.leave(sessionId);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and leave all sessions this user is in
    sessions.forEach((session, sessionId) => {
      const userIndex = session.users.findIndex(user => user.id === socket.id);
      
      if (userIndex !== -1) {
        const user = session.users[userIndex];
        session.users.splice(userIndex, 1);
        
        // Remove session if empty
        if (session.users.length === 0) {
          sessions.delete(sessionId);
        } else {
          // Notify others that user left
          io.to(sessionId).emit('userLeft', { id: socket.id, username: user.username });
        }
      }
    });
  });
});

// Basic API endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(session => {
    return {
      id: session.id,
      userCount: session.users.length,
      itemCount: session.items.length,
      budget: session.budget || 0,
      creator: session.creator || 'Unknown',
      totalAmount: session.totalAmount || 0,
      createdAt: session.createdAt
    };
  });
  
  res.status(200).json(sessionList);
});

// Product data endpoints - we can add FS persistence in milestone 4
let products = {};
let alternatives = {};

// Try to load sample data
try {
  products = require('./data/products.json');
  alternatives = require('./data/alternatives.json');
  console.log(`Loaded ${Object.keys(products).length} products and ${Object.keys(alternatives).length} alternatives`);
} catch (error) {
  console.log('Sample data not found, using empty objects');
}

app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

app.get('/api/products/:barcode', (req, res) => {
  const { barcode } = req.params;
  
  if (products[barcode]) {
    res.status(200).json(products[barcode]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.get('/api/alternatives', (req, res) => {
  res.status(200).json(alternatives);
});

app.get('/api/alternatives/:productName', (req, res) => {
  const { productName } = req.params;
  
  if (alternatives[productName]) {
    res.status(200).json(alternatives[productName]);
  } else {
    res.status(404).json({ error: 'Alternatives not found' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Test function for session management
function getActiveSessions() {
  return Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    userCount: session.users.length,
    itemCount: session.items.length
  }));
}

module.exports = { app, server, getActiveSessions }; 
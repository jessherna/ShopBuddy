/**
 * Initialization script to set up the backend with sample data
 */
const fs = require('fs');
const path = require('path');

// Sample product data
const sampleProducts = {
  '12345678': {
    name: 'Organic Milk',
    price: 6.99,
    updatedAt: new Date().toISOString()
  },
  '23456789': {
    name: 'Premium Coffee',
    price: 12.99,
    updatedAt: new Date().toISOString()
  },
  '34567890': {
    name: 'Branded Cereal',
    price: 5.49,
    updatedAt: new Date().toISOString()
  },
  '45678901': {
    name: 'Fresh Salmon',
    price: 15.99,
    updatedAt: new Date().toISOString()
  },
  '56789012': {
    name: 'Premium Chocolate',
    price: 8.49,
    updatedAt: new Date().toISOString()
  }
};

// Sample product alternatives
const sampleAlternatives = {
  'Organic Milk': [
    { name: 'Regular Milk', savingsPercent: 30 },
    { name: 'Store Brand Milk', savingsPercent: 40 }
  ],
  'Premium Coffee': [
    { name: 'Regular Coffee', savingsPercent: 45 },
    { name: 'Store Brand Coffee', savingsPercent: 60 }
  ],
  'Branded Cereal': [
    { name: 'Store Brand Cereal', savingsPercent: 35 }
  ],
  'Fresh Salmon': [
    { name: 'Frozen Salmon', savingsPercent: 25 },
    { name: 'Canned Tuna', savingsPercent: 70 }
  ],
  'Premium Chocolate': [
    { name: 'Regular Chocolate', savingsPercent: 40 }
  ]
};

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Created data directory');
}

// Write sample products data
fs.writeFileSync(
  path.join(dataDir, 'products.json'),
  JSON.stringify(sampleProducts, null, 2)
);
console.log('Sample products data created');

// Write sample alternatives data
fs.writeFileSync(
  path.join(dataDir, 'alternatives.json'),
  JSON.stringify(sampleAlternatives, null, 2)
);
console.log('Sample alternatives data created');

// Create a sessions file if it doesn't exist
const sessionsFile = path.join(dataDir, 'sessions.json');
if (!fs.existsSync(sessionsFile)) {
  fs.writeFileSync(sessionsFile, JSON.stringify({}));
  console.log('Sessions file created');
}

console.log('Backend initialization complete!');

// Test data access
function testDataAccess() {
  try {
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json')));
    const alternatives = JSON.parse(fs.readFileSync(path.join(dataDir, 'alternatives.json')));
    const sessions = JSON.parse(fs.readFileSync(path.join(dataDir, 'sessions.json')));
    
    console.log(`Products loaded: ${Object.keys(products).length}`);
    console.log(`Alternatives loaded: ${Object.keys(alternatives).length}`);
    console.log(`Sessions loaded: ${Object.keys(sessions).length}`);
    
    return true;
  } catch (error) {
    console.error('Error testing data access:', error);
    return false;
  }
}

// Run the test
const testResult = testDataAccess();
console.log(`Data access test ${testResult ? 'passed' : 'failed'}`);

module.exports = { sampleProducts, sampleAlternatives }; 
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * BudgetAgent is responsible for tracking spending against budget
 * and making recommendations if user is over budget
 */
export const useBudgetAgent = (initialBudget = 0) => {
  const [budget, setBudget] = useState(initialBudget);
  const [history, setHistory] = useState([]);
  const [alternatives, setAlternatives] = useState({});

  // Load budget history and alternatives from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load shopping history
        const storedHistory = await AsyncStorage.getItem('budgetHistory');
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }

        // Load product alternatives
        const storedAlternatives = await AsyncStorage.getItem('productAlternatives');
        if (storedAlternatives) {
          setAlternatives(JSON.parse(storedAlternatives));
        } else {
          // Default alternatives if none stored
          const defaultAlternatives = {
            // Example: expensive product -> cheaper alternatives
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
          setAlternatives(defaultAlternatives);
          await AsyncStorage.setItem('productAlternatives', JSON.stringify(defaultAlternatives));
        }
      } catch (error) {
        console.error('Error loading budget data:', error);
      }
    };

    loadData();
  }, []);

  // Update budget
  const updateBudget = useCallback((newBudget) => {
    setBudget(newBudget);
  }, []);

  // Check if current total is within budget
  const checkBudget = useCallback((total, currentBudget = budget) => {
    if (currentBudget <= 0) {
      // No budget set
      return {
        warning: false,
        message: 'No budget set',
        percentUsed: 0
      };
    }

    const percentUsed = (total / currentBudget) * 100;
    
    if (total > currentBudget) {
      return {
        warning: true,
        message: `You are ${((total - currentBudget) / currentBudget * 100).toFixed(1)}% over budget (${(total - currentBudget).toFixed(2)})`,
        percentUsed
      };
    } else if (percentUsed > 80) {
      return {
        warning: true,
        message: `You are approaching your budget (${percentUsed.toFixed(1)}% used)`,
        percentUsed
      };
    }
    
    return {
      warning: false,
      message: `Budget: ${percentUsed.toFixed(1)}% used`,
      percentUsed
    };
  }, [budget]);

  // Record a shopping trip to history
  const recordShoppingTrip = useCallback(async (items, total, date = new Date()) => {
    const newTrip = {
      date: date.toISOString(),
      items,
      total,
      withinBudget: total <= budget
    };
    
    const updatedHistory = [...history, newTrip];
    setHistory(updatedHistory);
    
    try {
      await AsyncStorage.setItem('budgetHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving budget history:', error);
    }
  }, [history, budget]);

  // Suggest alternatives to expensive items
  const suggestAlternatives = useCallback((items) => {
    if (!items || items.length === 0) return [];
    
    const recommendations = [];
    
    // Sort items by price (highest first) to focus on expensive items
    const sortedItems = [...items].sort((a, b) => 
      (b.price * b.quantity) - (a.price * a.quantity)
    );
    
    // Look for alternatives to the most expensive items
    for (const item of sortedItems) {
      // Check if we have alternatives for this exact item name
      if (alternatives[item.name]) {
        const itemAlts = alternatives[item.name];
        const itemTotal = item.price * item.quantity;
        
        // Add a recommendation
        const alt = itemAlts[0]; // Get first alternative
        recommendations.push(
          `Instead of "${item.name}" ($${item.price.toFixed(2)}), try "${alt.name}" to save approximately ${alt.savingsPercent}%.`
        );
        
        // Don't recommend too many alternatives at once
        if (recommendations.length >= 3) break;
      } else {
        // Try fuzzy matching if exact match not found
        for (const [productName, alts] of Object.entries(alternatives)) {
          if (item.name.toLowerCase().includes(productName.toLowerCase()) ||
              productName.toLowerCase().includes(item.name.toLowerCase())) {
            recommendations.push(
              `For "${item.name}", consider "${alts[0].name}" to save approximately ${alts[0].savingsPercent}%.`
            );
            break;
          }
        }
      }
    }
    
    // If no specific recommendations, add a general one
    if (recommendations.length === 0 && sortedItems.length > 0) {
      const mostExpensive = sortedItems[0];
      recommendations.push(
        `Your most expensive item is "${mostExpensive.name}" at $${mostExpensive.price.toFixed(2)} each. Consider looking for a store brand alternative.`
      );
    }
    
    return recommendations;
  }, [alternatives]);

  // Add a new alternative to the database
  const addAlternative = useCallback(async (productName, alternativeName, savingsPercent) => {
    const updatedAlternatives = { ...alternatives };
    
    if (!updatedAlternatives[productName]) {
      updatedAlternatives[productName] = [];
    }
    
    // Add the new alternative
    updatedAlternatives[productName].push({
      name: alternativeName,
      savingsPercent
    });
    
    // Sort by savings (highest first)
    updatedAlternatives[productName].sort((a, b) => b.savingsPercent - a.savingsPercent);
    
    // Update state and storage
    setAlternatives(updatedAlternatives);
    
    try {
      await AsyncStorage.setItem('productAlternatives', JSON.stringify(updatedAlternatives));
    } catch (error) {
      console.error('Error saving product alternatives:', error);
    }
  }, [alternatives]);

  return {
    budget,
    updateBudget,
    checkBudget,
    recordShoppingTrip,
    suggestAlternatives,
    addAlternative,
    history
  };
};

// Test function for the BudgetAgent - Non-hook based implementation for testing
export const testBudgetAgent = () => {
  // Test data
  const testBudget = 100;
  const testItems = [
    { name: 'Organic Milk', price: 6.99, quantity: 1 },
    { name: 'Premium Coffee', price: 12.99, quantity: 1 },
    { name: 'Bread', price: 3.49, quantity: 2 },
  ];
  
  // Calculate test total
  const testTotal = testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Mock alternatives database for testing
  const mockAlternatives = {
    'Organic Milk': [
      { name: 'Regular Milk', savingsPercent: 30 },
      { name: 'Store Brand Milk', savingsPercent: 40 }
    ],
    'Premium Coffee': [
      { name: 'Regular Coffee', savingsPercent: 45 },
      { name: 'Store Brand Coffee', savingsPercent: 60 }
    ]
  };
  
  // Test implementation of checkBudget without hooks
  const checkBudget = (total, currentBudget) => {
    if (currentBudget <= 0) {
      return {
        warning: false,
        message: 'No budget set',
        percentUsed: 0
      };
    }

    const percentUsed = (total / currentBudget) * 100;
    
    if (total > currentBudget) {
      return {
        warning: true,
        message: `You are ${((total - currentBudget) / currentBudget * 100).toFixed(1)}% over budget (${(total - currentBudget).toFixed(2)})`,
        percentUsed
      };
    } else if (percentUsed > 80) {
      return {
        warning: true,
        message: `You are approaching your budget (${percentUsed.toFixed(1)}% used)`,
        percentUsed
      };
    }
    
    return {
      warning: false,
      message: `Budget: ${percentUsed.toFixed(1)}% used`,
      percentUsed
    };
  };
  
  // Test implementation of suggestAlternatives without hooks
  const suggestAlternatives = (items) => {
    if (!items || items.length === 0) return [];
    
    const recommendations = [];
    
    // Sort items by price (highest first)
    const sortedItems = [...items].sort((a, b) => 
      (b.price * b.quantity) - (a.price * a.quantity)
    );
    
    // Look for alternatives to the most expensive items
    for (const item of sortedItems) {
      if (mockAlternatives[item.name]) {
        const itemAlts = mockAlternatives[item.name];
        const alt = itemAlts[0];
        recommendations.push(
          `Instead of "${item.name}" ($${item.price.toFixed(2)}), try "${alt.name}" to save approximately ${alt.savingsPercent}%.`
        );
        if (recommendations.length >= 3) break;
      }
    }
    
    if (recommendations.length === 0 && sortedItems.length > 0) {
      const mostExpensive = sortedItems[0];
      recommendations.push(
        `Your most expensive item is "${mostExpensive.name}" at $${mostExpensive.price.toFixed(2)} each. Consider looking for a store brand alternative.`
      );
    }
    
    return recommendations;
  };
  
  // Run tests
  const budgetStatus = checkBudget(testTotal, testBudget);
  console.assert(budgetStatus.percentUsed === (testTotal / testBudget) * 100, 'Percentage used calculation is wrong');
  
  const overBudgetStatus = checkBudget(testBudget + 20, testBudget);
  console.assert(overBudgetStatus.warning === true, 'Should show warning when over budget');
  
  const recommendations = suggestAlternatives(testItems);
  console.assert(recommendations.length > 0, 'Should provide at least one recommendation');
  console.assert(recommendations[0].includes('Premium Coffee') || recommendations[0].includes('Organic Milk'), 
    'Should recommend alternatives for expensive items');
  
  return 'BudgetAgent tests passed!';
}; 
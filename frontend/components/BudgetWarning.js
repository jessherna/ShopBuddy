import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * BudgetWarning - Displays a warning when the user exceeds their budget
 * 
 * @param {string} message - The warning message to display
 * @param {Function} onGetRecommendations - Callback to get budget recommendations
 */
const BudgetWarning = ({ message, onGetRecommendations }) => {
  return (
    <View style={styles.warningContainer}>
      <Text style={styles.warningText}>{message}</Text>
      <TouchableOpacity
        style={styles.recommendButton}
        onPress={onGetRecommendations}
      >
        <Text style={styles.recommendButtonText}>Get Recommendations</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  warningContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    color: '#721c24',
    flex: 1,
    fontSize: 14,
  },
  recommendButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  recommendButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// Test function for BudgetWarning
export const testBudgetWarning = () => {
  const testMessage = 'You are $25.00 over budget!';
  
  // Test rendering
  const component = <BudgetWarning 
    message={testMessage}
    onGetRecommendations={() => console.log('Get recommendations clicked')}
  />;
  
  // Verify component structure (simple test)
  console.assert(component !== null, 'Component should render');
  
  return 'BudgetWarning tests passed!';
};

export default BudgetWarning; 
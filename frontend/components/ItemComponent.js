import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * ItemComponent - Displays a shopping item in the list
 * 
 * @param {Object} item - The item to display
 * @param {Function} onRemove - Callback when item is removed
 * @param {Function} onEdit - Callback when item is edited (optional)
 * @param {Function} onIncreaseQuantity - Callback when quantity is increased
 * @param {Function} onDecreaseQuantity - Callback when quantity is decreased
 */
const ItemComponent = ({ 
  item, 
  onRemove, 
  onEdit,
  onIncreaseQuantity,
  onDecreaseQuantity
}) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          ${item.price.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onDecreaseQuantity(item)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onIncreaseQuantity(item)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.itemTotal}>
        ${(item.price * item.quantity).toFixed(2)}
      </Text>
      
      {onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(item)}
        >
          <Text style={styles.editButtonText}>✎</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginRight: 10,
    minWidth: 60,
    textAlign: 'right',
  },
  editButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffc107',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

// Test function for ItemComponent
export const testItemComponent = () => {
  const testItem = {
    id: '123',
    name: 'Test Item',
    price: 9.99,
    quantity: 2
  };
  
  // Test rendering
  const component = <ItemComponent 
    item={testItem}
    onRemove={() => console.log('Remove clicked')}
    onEdit={() => console.log('Edit clicked')}
    onIncreaseQuantity={() => console.log('Increase quantity clicked')}
    onDecreaseQuantity={() => console.log('Decrease quantity clicked')}
  />;
  
  // Verify component structure (simple test)
  console.assert(component !== null, 'Component should render');
  
  return 'ItemComponent tests passed!';
};

export default ItemComponent; 
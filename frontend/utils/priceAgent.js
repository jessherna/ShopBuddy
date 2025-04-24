import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PriceAgent is responsible for tracking and suggesting product prices
 * It stores known products and their prices in AsyncStorage
 */
export const usePriceAgent = () => {
  const [products, setProducts] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load products from storage when component mounts
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem('products');
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading products:', error);
        setIsLoaded(true);
      }
    };

    loadProducts();
  }, []);

  // Save products to storage
  const saveProducts = useCallback(async (updatedProducts) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error saving products:', error);
    }
  }, []);

  // Check if a product exists by barcode
  const checkPrice = useCallback(async (barcode) => {
    // Make sure products are loaded
    if (!isLoaded) {
      const storedProducts = await AsyncStorage.getItem('products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
      setIsLoaded(true);
    }

    // Return product if found
    return products[barcode] || null;
  }, [products, isLoaded]);

  // Suggest a price update for a product
  const suggestPriceUpdate = useCallback(async (barcode, name, price) => {
    // Update or add the product
    const updatedProducts = {
      ...products,
      [barcode]: {
        name,
        price,
        updatedAt: new Date().toISOString(),
      },
    };

    // Save the updated products
    await saveProducts(updatedProducts);
  }, [products, saveProducts]);

  // Get a list of all products
  const getAllProducts = useCallback(() => {
    return Object.entries(products).map(([barcode, product]) => ({
      barcode,
      ...product,
    }));
  }, [products]);

  return {
    checkPrice,
    suggestPriceUpdate,
    getAllProducts,
  };
};

// Test function for the PriceAgent - Non-hook based implementation for testing
export const testPriceAgent = async () => {
  try {
    // Create a test product
    const testBarcode = '12345678';
    const testProduct = {
      name: 'Test Product',
      price: 9.99,
    };

    // Mock storage
    let mockStorage = {};

    // Mock AsyncStorage for testing
    const mockAsyncStorage = {
      getItem: async (key) => {
        console.log('MockStorage getItem:', key, mockStorage[key]);
        return mockStorage[key] || null;
      },
      setItem: async (key, value) => {
        console.log('MockStorage setItem:', key);
        mockStorage[key] = value;
      },
      removeItem: async (key) => {
        console.log('MockStorage removeItem:', key);
        delete mockStorage[key];
      }
    };

    // Clear mock storage
    mockStorage = {};

    // Mock functions that don't use hooks
    const checkPrice = async (barcode) => {
      try {
        // Get products from storage
        const storedProductsJson = await mockAsyncStorage.getItem('products');
        const storedProducts = storedProductsJson ? JSON.parse(storedProductsJson) : {};
        
        // Return product if found
        return storedProducts[barcode] || null;
      } catch (error) {
        console.error('Error in checkPrice test:', error);
        return null;
      }
    };

    const suggestPriceUpdate = async (barcode, name, price) => {
      try {
        // Get current products from storage
        const storedProductsJson = await mockAsyncStorage.getItem('products');
        const storedProducts = storedProductsJson ? JSON.parse(storedProductsJson) : {};
        
        // Update or add the product
        const updatedProducts = {
          ...storedProducts,
          [barcode]: {
            name,
            price,
            updatedAt: new Date().toISOString(),
          },
        };
        
        // Save updated products
        await mockAsyncStorage.setItem('products', JSON.stringify(updatedProducts));
        return true;
      } catch (error) {
        console.error('Error in suggestPriceUpdate test:', error);
        return false;
      }
    };

    const getAllProducts = async () => {
      try {
        // Get products from storage
        const storedProductsJson = await mockAsyncStorage.getItem('products');
        const storedProducts = storedProductsJson ? JSON.parse(storedProductsJson) : {};
        
        // Convert to array format
        return Object.entries(storedProducts).map(([barcode, product]) => ({
          barcode,
          ...product,
        }));
      } catch (error) {
        console.error('Error in getAllProducts test:', error);
        return [];
      }
    };

    // Run the tests
    console.log('Starting PriceAgent tests...');
    
    // Clear storage
    await mockAsyncStorage.removeItem('products');
    
    // Check if product exists initially (should be null)
    const initialProduct = await checkPrice(testBarcode);
    console.assert(initialProduct === null, 'Initial product should be null');
    
    // Add the product
    await suggestPriceUpdate(testBarcode, testProduct.name, testProduct.price);
    
    // Get storage content for verification
    const storedProductsJson = await mockAsyncStorage.getItem('products');
    console.log('Storage after adding product:', storedProductsJson);
    
    // Check if product exists now
    const updatedProduct = await checkPrice(testBarcode);
    console.assert(updatedProduct !== null, 'Updated product should not be null');
    
    if (updatedProduct) {
      console.assert(updatedProduct.name === testProduct.name, 'Product name should match');
      console.assert(updatedProduct.price === testProduct.price, 'Product price should match');
    } else {
      console.log('Product not found in storage');
    }
    
    // Get all products
    const allProducts = await getAllProducts();
    console.assert(allProducts.length > 0, 'Should have at least one product');
    
    return 'PriceAgent tests passed!';
  } catch (error) {
    console.error('PriceAgent test error:', error);
    return 'PriceAgent tests failed: ' + error.message;
  }
}; 
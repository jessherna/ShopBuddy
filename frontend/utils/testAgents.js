import { testPriceAgent } from './priceAgent';
import { testBudgetAgent } from './budgetAgent';
import { testSocketAgent } from './socketAgent';

/**
 * Test all agent modules
 */
export const runAllTests = async () => {
  console.log('Running all agent tests...');
  
  // Keep track of test results
  const results = {
    passed: [],
    failed: []
  };
  
  try {
    // Test PriceAgent
    console.log('Testing PriceAgent...');
    await testPriceAgent();
    results.passed.push('PriceAgent');
  } catch (error) {
    console.error('PriceAgent test failed:', error);
    results.failed.push('PriceAgent');
  }
  
  try {
    // Test BudgetAgent
    console.log('Testing BudgetAgent...');
    testBudgetAgent();
    results.passed.push('BudgetAgent');
  } catch (error) {
    console.error('BudgetAgent test failed:', error);
    results.failed.push('BudgetAgent');
  }
  
  try {
    // Test SocketAgent
    console.log('Testing SocketAgent...');
    testSocketAgent();
    results.passed.push('SocketAgent');
  } catch (error) {
    console.error('SocketAgent test failed:', error);
    results.failed.push('SocketAgent');
  }
  
  // Log results
  console.log('\nTest Results:');
  console.log(`Passed: ${results.passed.length}/${results.passed.length + results.failed.length}`);
  
  if (results.passed.length > 0) {
    console.log('✅ Passed Tests:');
    results.passed.forEach(test => console.log(`  - ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('❌ Failed Tests:');
    results.failed.forEach(test => console.log(`  - ${test}`));
  }
  
  return results;
};

// If we're running this file directly, run the tests
if (require.main === module) {
  runAllTests()
    .then(() => console.log('All tests completed!'))
    .catch(error => console.error('Tests failed:', error));
}

export default { runAllTests }; 
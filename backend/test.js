const { getActiveSessions } = require('./index');
const assert = require('assert');

// Mock socket interactions
function testSessionManagement() {
  try {
    // Get initial sessions (should be empty)
    const initialSessions = getActiveSessions();
    assert.strictEqual(initialSessions.length, 0, 'Initial sessions should be empty');
    
    console.log('✅ Session management tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running backend tests...');
  testSessionManagement();
}

module.exports = { testSessionManagement }; 
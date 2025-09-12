/**
 * Simple test for retry utility functions
 * Run with: node backend/test/retryUtils.test.js
 */

const { retryWithBackoff } = require('../utils/retryUtils');

// Mock function that fails with 429 error first two times, then succeeds
let callCount = 0;
const mockApiCall = async () => {
  callCount++;
  console.log(`API call attempt ${callCount}`);
  
  if (callCount <= 2) {
    const error = new Error('Rate limited');
    error.response = { status: 429 };
    throw error;
  }
  
  return { data: { success: true, message: 'API call successful' } };
};

// Test the retry logic
async function testRetryLogic() {
  console.log('Testing retry logic with exponential backoff...\n');
  
  try {
    const result = await retryWithBackoff(mockApiCall, 3, 500); // 3 retries, 500ms base delay
    console.log('\nSuccess!', result.data);
  } catch (error) {
    console.log('\nFailed after all retries:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testRetryLogic();
}

module.exports = { testRetryLogic };

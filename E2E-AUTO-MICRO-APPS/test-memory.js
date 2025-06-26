/**
 * Memory-Bank Test Script
 * 
 * Creates a test memory to verify the installation.
 */

// Import the Memory-Bank initialization module
const { getMemoryBank } = require('./modules/init-memory');

async function testMemory() {
  try {
    // Get Memory-Bank instance
    const memoryBank = getMemoryBank();
    
    // Store a test memory
    console.log('Storing test memory...');
    await memoryBank.store('system', 'bootstrap_test', {
      message: 'Memory-Bank integration successful!',
      timestamp: new Date().toISOString(),
      testData: {
        number: 42,
        text: 'Hello, Memory-Bank!',
        boolean: true
      }
    });
    
    // Retrieve the test memory
    console.log('Retrieving test memory...');
    const testMemory = await memoryBank.retrieve('system', 'bootstrap_test');
    
    // Display the retrieved memory
    console.log('Retrieved memory:', JSON.stringify(testMemory, null, 2));
    
    console.log('✅ Memory-Bank test completed successfully!');
  } catch (error) {
    console.error('❌ Memory-Bank test failed:', error);
  }
}

// Run the test
testMemory();

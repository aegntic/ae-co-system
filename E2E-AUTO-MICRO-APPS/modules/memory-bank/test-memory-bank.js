/**
 * Memory-Bank: Integration Test Utility
 * 
 * Simple script to test the Memory-Bank functionality.
 */

const MemoryBank = require('./index');

async function runTests() {
  console.log('Initializing Memory-Bank for testing...');
  
  // Create a test instance with temporary storage
  const memoryBank = new MemoryBank({
    storageDir: './test-memory'
  });
  
  // Test storing a memory
  console.log('\nTesting memory storage...');
  const testData = {
    text: 'This is a test memory',
    value: 42,
    nested: {
      prop: 'test property'
    }
  };
  
  const storeResult = await memoryBank.store('test-category', 'test-key-1', testData, {
    metadata: {
      source: 'test-script',
      tags: ['test', 'integration']
    }
  });
  
  console.log('Store result:', storeResult);
  
  // Test retrieving a memory
  console.log('\nTesting memory retrieval...');
  const retrievedData = await memoryBank.retrieve('test-category', 'test-key-1');
  console.log('Retrieved data:', retrievedData);
  
  // Test listing memories
  console.log('\nTesting memory listing...');
  
  // Store a second memory
  await memoryBank.store('test-category', 'test-key-2', {
    text: 'Another test memory',
    value: 99
  });
  
  const memoryList = await memoryBank.list('test-category');
  console.log('Memory list:', memoryList);
  
  // Test deleting a memory
  console.log('\nTesting memory deletion...');
  const deleteResult = await memoryBank.delete('test-category', 'test-key-1');
  console.log('Delete result:', deleteResult);
  
  // Verify deletion
  const afterDeleteList = await memoryBank.list('test-category');
  console.log('After deletion list:', afterDeleteList);
  
  console.log('\nAll tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
}

/**
 * @fileoverview Global test teardown for Jest
 * @author Udyam Backend Team
 * @version 1.0.0
 */

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global resources
  if (global.testPrisma) {
    await global.testPrisma.$disconnect();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Test environment cleanup complete');
};
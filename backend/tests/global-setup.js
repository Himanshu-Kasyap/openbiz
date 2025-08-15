/**
 * @fileoverview Global test setup for Jest
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Ensure test database is ready
  if (process.env.TEST_DATABASE_URL) {
    try {
      console.log('📊 Setting up test database...');
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          DATABASE_URL: process.env.TEST_DATABASE_URL 
        }
      });
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Test database ready');
    } catch (error) {
      console.error('❌ Failed to setup test database:', error.message);
      process.exit(1);
    }
  }
  
  // Clear any existing test data
  console.log('🧹 Cleaning up test environment...');
  
  console.log('✅ Test environment setup complete');
};
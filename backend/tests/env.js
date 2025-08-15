/**
 * @fileoverview Test environment variables setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/udyam_test?schema=public';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
/**
 * @fileoverview Jest setup file for scraper tests
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(30000);

// Mock fs-extra to prevent actual file operations during tests
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(),
  writeJson: jest.fn().mockResolvedValue(),
  readJson: jest.fn().mockResolvedValue({}),
  pathExists: jest.fn().mockResolvedValue(true),
  remove: jest.fn().mockResolvedValue(),
  copy: jest.fn().mockResolvedValue()
}));

// Mock winston logger to prevent actual logging during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Global test helpers
global.createMockField = (overrides = {}) => ({
  id: 'test_field',
  name: 'testField',
  type: 'text',
  label: 'Test Field',
  required: false,
  validationRules: [],
  ...overrides
});

global.createMockValidationRule = (overrides = {}) => ({
  type: 'required',
  value: true,
  message: 'This field is required',
  ...overrides
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
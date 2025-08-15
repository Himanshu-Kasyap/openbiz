/**
 * @fileoverview Test setup configuration
 */

const { PrismaClient } = require('@prisma/client');

// Use a separate test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/udyam_test?schema=public',
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data in reverse order of dependencies
  await prisma.formSubmission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.formSchema.deleteMany();
});

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect();
});

// Make prisma available globally in tests
global.testPrisma = prisma;
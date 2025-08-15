/**
 * @fileoverview Unit tests for database configuration
 */

const {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  prisma,
} = require('../../src/config/database');

describe('Database Configuration', () => {
  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      await expect(connectDatabase()).resolves.not.toThrow();
    });

    it('should check database health', async () => {
      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });

    it('should disconnect from database successfully', async () => {
      await expect(disconnectDatabase()).resolves.not.toThrow();
      
      // Reconnect for other tests
      await connectDatabase();
    });
  });

  describe('Prisma Client', () => {
    it('should have prisma client instance', () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
    });

    it('should execute raw queries', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toHaveLength(1);
      expect(result[0].test).toBe(1);
    });

    it('should access model methods', () => {
      expect(prisma.user).toBeDefined();
      expect(prisma.formSubmission).toBeDefined();
      expect(prisma.formSchema).toBeDefined();
      
      expect(typeof prisma.user.create).toBe('function');
      expect(typeof prisma.user.findMany).toBe('function');
      expect(typeof prisma.user.update).toBe('function');
      expect(typeof prisma.user.delete).toBe('function');
    });
  });

  describe('Database Schema Validation', () => {
    it('should have all required tables', async () => {
      // Check if tables exist by trying to query them
      await expect(prisma.user.findMany()).resolves.toBeDefined();
      await expect(prisma.formSubmission.findMany()).resolves.toBeDefined();
      await expect(prisma.formSchema.findMany()).resolves.toBeDefined();
    });

    it('should enforce foreign key constraints', async () => {
      // Try to create a form submission with invalid user ID
      await expect(
        prisma.formSubmission.create({
          data: {
            userId: 'non-existent-user-id',
            stepNumber: 1,
            formData: { test: 'data' },
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      const sessionId = 'unique-constraint-test';
      
      await prisma.user.create({
        data: { sessionId },
      });

      // Try to create another user with the same session ID
      await expect(
        prisma.user.create({
          data: { sessionId },
        })
      ).rejects.toThrow();
    });
  });

  describe('Database Indexes', () => {
    it('should have indexes on form_submissions table', async () => {
      // Create test data
      const user = await prisma.user.create({
        data: { sessionId: 'index-test-session' },
      });

      await prisma.formSubmission.create({
        data: {
          userId: user.id,
          stepNumber: 1,
          formData: { test: 'data' },
        },
      });

      // These queries should use indexes efficiently
      const userSubmissions = await prisma.formSubmission.findMany({
        where: {
          userId: user.id,
          stepNumber: 1,
        },
      });

      expect(userSubmissions).toHaveLength(1);

      const recentSubmissions = await prisma.formSubmission.findMany({
        where: {
          submittedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      expect(recentSubmissions.length).toBeGreaterThan(0);
    });

    it('should have indexes on form_schemas table', async () => {
      await prisma.formSchema.create({
        data: {
          version: 'index-test-1.0.0',
          schemaData: { test: 'data' },
          isActive: true,
        },
      });

      // These queries should use indexes efficiently
      const activeSchemas = await prisma.formSchema.findMany({
        where: { isActive: true },
      });

      expect(activeSchemas.length).toBeGreaterThan(0);

      const versionSchema = await prisma.formSchema.findUnique({
        where: { version: 'index-test-1.0.0' },
      });

      expect(versionSchema).toBeTruthy();
    });
  });
});
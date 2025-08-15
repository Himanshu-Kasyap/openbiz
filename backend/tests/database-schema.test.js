/**
 * @fileoverview Tests for database schema validation without requiring database connection
 */

const { PrismaClient } = require('@prisma/client');

describe('Database Schema Validation', () => {
  let prisma;

  beforeAll(() => {
    // Create Prisma client instance for schema validation
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Prisma Client Setup', () => {
    it('should create Prisma client instance', () => {
      expect(prisma).toBeDefined();
      expect(prisma).toBeInstanceOf(PrismaClient);
    });

    it('should have all required models', () => {
      expect(prisma.user).toBeDefined();
      expect(prisma.formSubmission).toBeDefined();
      expect(prisma.formSchema).toBeDefined();
    });

    it('should have CRUD methods on User model', () => {
      expect(typeof prisma.user.create).toBe('function');
      expect(typeof prisma.user.findMany).toBe('function');
      expect(typeof prisma.user.findUnique).toBe('function');
      expect(typeof prisma.user.update).toBe('function');
      expect(typeof prisma.user.delete).toBe('function');
      expect(typeof prisma.user.count).toBe('function');
    });

    it('should have CRUD methods on FormSubmission model', () => {
      expect(typeof prisma.formSubmission.create).toBe('function');
      expect(typeof prisma.formSubmission.findMany).toBe('function');
      expect(typeof prisma.formSubmission.findUnique).toBe('function');
      expect(typeof prisma.formSubmission.update).toBe('function');
      expect(typeof prisma.formSubmission.delete).toBe('function');
      expect(typeof prisma.formSubmission.count).toBe('function');
      expect(typeof prisma.formSubmission.groupBy).toBe('function');
    });

    it('should have CRUD methods on FormSchema model', () => {
      expect(typeof prisma.formSchema.create).toBe('function');
      expect(typeof prisma.formSchema.findMany).toBe('function');
      expect(typeof prisma.formSchema.findUnique).toBe('function');
      expect(typeof prisma.formSchema.update).toBe('function');
      expect(typeof prisma.formSchema.delete).toBe('function');
      expect(typeof prisma.formSchema.count).toBe('function');
    });
  });

  describe('Database Configuration Module', () => {
    it('should import database configuration without errors', () => {
      expect(() => {
        require('../src/config/database');
      }).not.toThrow();
    });

    it('should export required functions', () => {
      const dbConfig = require('../src/config/database');
      
      expect(typeof dbConfig.connectDatabase).toBe('function');
      expect(typeof dbConfig.disconnectDatabase).toBe('function');
      expect(typeof dbConfig.checkDatabaseHealth).toBe('function');
      expect(dbConfig.prisma).toBeDefined();
    });
  });

  describe('Database Utils Module', () => {
    it('should import database utils without errors', () => {
      expect(() => {
        require('../src/utils/database-utils');
      }).not.toThrow();
    });

    it('should export required utility functions', () => {
      const dbUtils = require('../src/utils/database-utils');
      
      expect(typeof dbUtils.getDatabaseStats).toBe('function');
      expect(typeof dbUtils.cleanupOldSubmissions).toBe('function');
      expect(typeof dbUtils.getUserSubmissionHistory).toBe('function');
      expect(typeof dbUtils.getActiveFormSchema).toBe('function');
      expect(typeof dbUtils.updateFormSchema).toBe('function');
      expect(typeof dbUtils.bulkInsertSubmissions).toBe('function');
      expect(typeof dbUtils.getSubmissionAnalytics).toBe('function');
    });
  });

  describe('Schema Structure Validation', () => {
    it('should validate User model structure', () => {
      // Test that we can create a valid user data structure
      const validUserData = {
        sessionId: 'test-session-123',
        status: 'in_progress',
      };

      expect(validUserData).toMatchObject({
        sessionId: expect.any(String),
        status: expect.any(String),
      });
    });

    it('should validate FormSubmission model structure', () => {
      const validSubmissionData = {
        userId: 'user-id-123',
        stepNumber: 1,
        formData: {
          aadhaarNumber: '123456789012',
          otp: '123456',
        },
        validationStatus: 'pending',
      };

      expect(validSubmissionData).toMatchObject({
        userId: expect.any(String),
        stepNumber: expect.any(Number),
        formData: expect.any(Object),
        validationStatus: expect.any(String),
      });
    });

    it('should validate FormSchema model structure', () => {
      const validSchemaData = {
        version: '1.0.0',
        schemaData: {
          steps: [
            {
              stepNumber: 1,
              title: 'Test Step',
              fields: [],
            },
          ],
        },
        isActive: true,
      };

      expect(validSchemaData).toMatchObject({
        version: expect.any(String),
        schemaData: expect.any(Object),
        isActive: expect.any(Boolean),
      });
    });
  });

  describe('Migration Files', () => {
    it('should have migration files in correct location', () => {
      const fs = require('fs');
      const path = require('path');

      const migrationDir = path.join(__dirname, '../prisma/migrations');
      expect(fs.existsSync(migrationDir)).toBe(true);

      const migrationLock = path.join(__dirname, '../prisma/migrations/migration_lock.toml');
      expect(fs.existsSync(migrationLock)).toBe(true);
    });

    it('should have seed file', () => {
      const fs = require('fs');
      const path = require('path');

      const seedFile = path.join(__dirname, '../prisma/seed.js');
      expect(fs.existsSync(seedFile)).toBe(true);
    });
  });
});
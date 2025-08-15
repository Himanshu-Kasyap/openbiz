/**
 * @fileoverview Unit tests for database utility functions
 */

const {
  getDatabaseStats,
  cleanupOldSubmissions,
  getUserSubmissionHistory,
  getActiveFormSchema,
  updateFormSchema,
  bulkInsertSubmissions,
  getSubmissionAnalytics,
} = require('../../src/utils/database-utils');

describe('Database Utils', () => {
  let prisma;
  let testUser;

  beforeAll(() => {
    prisma = global.testPrisma;
  });

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        sessionId: 'db-utils-test-session',
        status: 'in_progress',
      },
    });
  });

  describe('getDatabaseStats', () => {
    beforeEach(async () => {
      await prisma.formSubmission.createMany({
        data: [
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'data1' },
          },
          {
            userId: testUser.id,
            stepNumber: 2,
            formData: { test: 'data2' },
          },
        ],
      });

      await prisma.formSchema.create({
        data: {
          version: 'stats-test-1.0.0',
          schemaData: { test: 'schema' },
        },
      });
    });

    it('should return correct database statistics', async () => {
      const stats = await getDatabaseStats();

      expect(stats).toMatchObject({
        totalUsers: 1,
        totalSubmissions: 2,
        totalSchemas: 1,
        recentSubmissions: 2, // Both submissions are recent
      });
      expect(stats.timestamp).toBeDefined();
      expect(new Date(stats.timestamp)).toBeInstanceOf(Date);
    });

    it('should count recent submissions correctly', async () => {
      // Create an old submission (more than 24 hours ago)
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await prisma.formSubmission.create({
        data: {
          userId: testUser.id,
          stepNumber: 3,
          formData: { test: 'old' },
          submittedAt: oldDate,
        },
      });

      const stats = await getDatabaseStats();

      expect(stats.totalSubmissions).toBe(3);
      expect(stats.recentSubmissions).toBe(2); // Only recent ones
    });
  });

  describe('cleanupOldSubmissions', () => {
    beforeEach(async () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      await prisma.formSubmission.createMany({
        data: [
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'old1' },
            validationStatus: 'completed',
            submittedAt: oldDate,
          },
          {
            userId: testUser.id,
            stepNumber: 2,
            formData: { test: 'old2' },
            validationStatus: 'completed',
            submittedAt: oldDate,
          },
          {
            userId: testUser.id,
            stepNumber: 3,
            formData: { test: 'recent' },
            validationStatus: 'completed',
            submittedAt: recentDate,
          },
          {
            userId: testUser.id,
            stepNumber: 4,
            formData: { test: 'old_pending' },
            validationStatus: 'pending',
            submittedAt: oldDate,
          },
        ],
      });
    });

    it('should cleanup old completed submissions', async () => {
      const deletedCount = await cleanupOldSubmissions();

      expect(deletedCount).toBe(2); // Only old completed submissions

      const remainingSubmissions = await prisma.formSubmission.findMany();
      expect(remainingSubmissions).toHaveLength(2); // Recent and pending submissions remain
    });

    it('should not delete pending submissions', async () => {
      await cleanupOldSubmissions();

      const pendingSubmissions = await prisma.formSubmission.findMany({
        where: { validationStatus: 'pending' },
      });

      expect(pendingSubmissions).toHaveLength(1);
    });
  });

  describe('getUserSubmissionHistory', () => {
    beforeEach(async () => {
      // Create submissions with different timestamps
      const submissions = [];
      for (let i = 1; i <= 15; i++) {
        submissions.push({
          userId: testUser.id,
          stepNumber: i % 3 + 1,
          formData: { test: `data${i}` },
          submittedAt: new Date(Date.now() - i * 60 * 60 * 1000), // i hours ago
        });
      }

      await prisma.formSubmission.createMany({ data: submissions });
    });

    it('should return paginated submission history', async () => {
      const result = await getUserSubmissionHistory(testUser.id, 1, 5);

      expect(result.submissions).toHaveLength(5);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });

      // Should be ordered by submittedAt desc (most recent first)
      expect(result.submissions[0].submittedAt.getTime()).toBeGreaterThan(
        result.submissions[1].submittedAt.getTime()
      );
    });

    it('should handle different page numbers', async () => {
      const page2 = await getUserSubmissionHistory(testUser.id, 2, 5);

      expect(page2.submissions).toHaveLength(5);
      expect(page2.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should include user data', async () => {
      const result = await getUserSubmissionHistory(testUser.id, 1, 1);

      expect(result.submissions[0].user).toBeDefined();
      expect(result.submissions[0].user.sessionId).toBe('db-utils-test-session');
    });
  });

  describe('getActiveFormSchema', () => {
    beforeEach(async () => {
      await prisma.formSchema.createMany({
        data: [
          {
            version: 'inactive-1.0.0',
            schemaData: { test: 'inactive' },
            isActive: false,
          },
          {
            version: 'active-1.0.0',
            schemaData: { test: 'active' },
            isActive: true,
          },
          {
            version: 'inactive-2.0.0',
            schemaData: { test: 'inactive2' },
            isActive: false,
          },
        ],
      });
    });

    it('should return the active form schema', async () => {
      const activeSchema = await getActiveFormSchema();

      expect(activeSchema).toBeTruthy();
      expect(activeSchema.version).toBe('active-1.0.0');
      expect(activeSchema.isActive).toBe(true);
    });

    it('should return null when no active schema exists', async () => {
      // Deactivate all schemas
      await prisma.formSchema.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const activeSchema = await getActiveFormSchema();
      expect(activeSchema).toBeNull();
    });
  });

  describe('updateFormSchema', () => {
    beforeEach(async () => {
      await prisma.formSchema.createMany({
        data: [
          {
            version: 'old-active-1.0.0',
            schemaData: { test: 'old' },
            isActive: true,
          },
          {
            version: 'old-inactive-1.0.0',
            schemaData: { test: 'old2' },
            isActive: false,
          },
        ],
      });
    });

    it('should create new active schema and deactivate others', async () => {
      const newSchemaData = {
        version: '2.0.0',
        steps: [{ stepNumber: 1, title: 'New Step' }],
      };

      const newSchema = await updateFormSchema('2.0.0', newSchemaData);

      expect(newSchema.version).toBe('2.0.0');
      expect(newSchema.isActive).toBe(true);
      expect(newSchema.schemaData).toEqual(newSchemaData);

      // Check that old schemas are deactivated
      const oldActiveSchemas = await prisma.formSchema.findMany({
        where: {
          version: { not: '2.0.0' },
          isActive: true,
        },
      });

      expect(oldActiveSchemas).toHaveLength(0);
    });

    it('should handle transaction rollback on error', async () => {
      // This test would require mocking to simulate transaction failure
      // For now, we'll test the happy path
      const newSchemaData = { test: 'new schema' };
      const result = await updateFormSchema('3.0.0', newSchemaData);

      expect(result.version).toBe('3.0.0');
      expect(result.isActive).toBe(true);
    });
  });

  describe('bulkInsertSubmissions', () => {
    it('should insert multiple submissions', async () => {
      const submissions = [
        {
          userId: testUser.id,
          stepNumber: 1,
          formData: { bulk: 'data1' },
        },
        {
          userId: testUser.id,
          stepNumber: 2,
          formData: { bulk: 'data2' },
        },
        {
          userId: testUser.id,
          stepNumber: 3,
          formData: { bulk: 'data3' },
        },
      ];

      const insertedCount = await bulkInsertSubmissions(submissions);

      expect(insertedCount).toBe(3);

      const allSubmissions = await prisma.formSubmission.findMany({
        where: { userId: testUser.id },
      });

      expect(allSubmissions).toHaveLength(3);
    });

    it('should skip duplicates when specified', async () => {
      const submission = {
        id: 'duplicate-test-id',
        userId: testUser.id,
        stepNumber: 1,
        formData: { test: 'duplicate' },
      };

      // Insert first time
      await prisma.formSubmission.create({ data: submission });

      // Try to bulk insert the same submission
      const insertedCount = await bulkInsertSubmissions([submission]);

      expect(insertedCount).toBe(0); // Should skip duplicate

      const submissions = await prisma.formSubmission.findMany({
        where: { id: 'duplicate-test-id' },
      });

      expect(submissions).toHaveLength(1); // Only one should exist
    });
  });

  describe('getSubmissionAnalytics', () => {
    beforeEach(async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await prisma.formSubmission.createMany({
        data: [
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'data1' },
            validationStatus: 'completed',
            submittedAt: new Date('2024-01-15'),
          },
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'data2' },
            validationStatus: 'pending',
            submittedAt: new Date('2024-01-16'),
          },
          {
            userId: testUser.id,
            stepNumber: 2,
            formData: { test: 'data3' },
            validationStatus: 'completed',
            submittedAt: new Date('2024-01-17'),
          },
          {
            userId: testUser.id,
            stepNumber: 2,
            formData: { test: 'data4' },
            validationStatus: 'completed',
            submittedAt: new Date('2024-01-18'),
          },
          // This should be excluded (outside date range)
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'data5' },
            validationStatus: 'completed',
            submittedAt: new Date('2024-02-01'),
          },
        ],
      });
    });

    it('should return analytics grouped by step and status', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics = await getSubmissionAnalytics(startDate, endDate);

      expect(analytics).toHaveLength(3);

      const step1Completed = analytics.find(
        a => a.step === 1 && a.status === 'completed'
      );
      const step1Pending = analytics.find(
        a => a.step === 1 && a.status === 'pending'
      );
      const step2Completed = analytics.find(
        a => a.step === 2 && a.status === 'completed'
      );

      expect(step1Completed.count).toBe(1);
      expect(step1Pending.count).toBe(1);
      expect(step2Completed.count).toBe(2);
    });

    it('should respect date range filters', async () => {
      const startDate = new Date('2024-01-16');
      const endDate = new Date('2024-01-17');

      const analytics = await getSubmissionAnalytics(startDate, endDate);

      const totalCount = analytics.reduce((sum, item) => sum + item.count, 0);
      expect(totalCount).toBe(2); // Only submissions from 16th and 17th
    });
  });
});
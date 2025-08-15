/**
 * @fileoverview Unit tests for FormSubmission model
 */

const { PrismaClient } = require('@prisma/client');

describe('FormSubmission Model', () => {
  let prisma;
  let testUser;

  beforeAll(() => {
    prisma = global.testPrisma;
  });

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        sessionId: 'form-submission-test-session',
        status: 'in_progress',
      },
    });
  });

  describe('FormSubmission Creation', () => {
    it('should create a form submission with valid data', async () => {
      const submissionData = {
        userId: testUser.id,
        stepNumber: 1,
        formData: {
          aadhaarNumber: '123456789012',
          otp: '123456',
        },
        validationStatus: 'pending',
      };

      const submission = await prisma.formSubmission.create({
        data: submissionData,
      });

      expect(submission).toMatchObject({
        userId: testUser.id,
        stepNumber: 1,
        validationStatus: 'pending',
      });
      expect(submission.formData).toEqual({
        aadhaarNumber: '123456789012',
        otp: '123456',
      });
      expect(submission.id).toBeDefined();
      expect(submission.submittedAt).toBeInstanceOf(Date);
    });

    it('should create a form submission with default validation status', async () => {
      const submissionData = {
        userId: testUser.id,
        stepNumber: 2,
        formData: { panNumber: 'ABCDE1234F' },
      };

      const submission = await prisma.formSubmission.create({
        data: submissionData,
      });

      expect(submission.validationStatus).toBe('pending');
    });

    it('should handle complex JSON form data', async () => {
      const complexFormData = {
        personalDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            street: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
          },
        },
        businessDetails: {
          type: 'Manufacturing',
          category: 'Micro',
        },
        documents: [
          { type: 'aadhaar', number: '123456789012' },
          { type: 'pan', number: 'ABCDE1234F' },
        ],
      };

      const submission = await prisma.formSubmission.create({
        data: {
          userId: testUser.id,
          stepNumber: 2,
          formData: complexFormData,
        },
      });

      expect(submission.formData).toEqual(complexFormData);
    });
  });

  describe('FormSubmission Queries', () => {
    beforeEach(async () => {
      await prisma.formSubmission.createMany({
        data: [
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { step: 1, data: 'test1' },
            validationStatus: 'completed',
          },
          {
            userId: testUser.id,
            stepNumber: 2,
            formData: { step: 2, data: 'test2' },
            validationStatus: 'pending',
          },
        ],
      });
    });

    it('should find submissions by user ID', async () => {
      const submissions = await prisma.formSubmission.findMany({
        where: { userId: testUser.id },
        orderBy: { stepNumber: 'asc' },
      });

      expect(submissions).toHaveLength(2);
      expect(submissions[0].stepNumber).toBe(1);
      expect(submissions[1].stepNumber).toBe(2);
    });

    it('should find submissions by step number', async () => {
      const submissions = await prisma.formSubmission.findMany({
        where: { stepNumber: 1 },
      });

      expect(submissions).toHaveLength(1);
      expect(submissions[0].stepNumber).toBe(1);
    });

    it('should find submissions by validation status', async () => {
      const completedSubmissions = await prisma.formSubmission.findMany({
        where: { validationStatus: 'completed' },
      });

      expect(completedSubmissions).toHaveLength(1);
      expect(completedSubmissions[0].validationStatus).toBe('completed');
    });

    it('should include user data in queries', async () => {
      const submissions = await prisma.formSubmission.findMany({
        where: { userId: testUser.id },
        include: { user: true },
      });

      expect(submissions[0].user).toBeDefined();
      expect(submissions[0].user.sessionId).toBe('form-submission-test-session');
    });
  });

  describe('FormSubmission Updates', () => {
    let testSubmission;

    beforeEach(async () => {
      testSubmission = await prisma.formSubmission.create({
        data: {
          userId: testUser.id,
          stepNumber: 1,
          formData: { initial: 'data' },
          validationStatus: 'pending',
        },
      });
    });

    it('should update validation status', async () => {
      const updatedSubmission = await prisma.formSubmission.update({
        where: { id: testSubmission.id },
        data: { validationStatus: 'completed' },
      });

      expect(updatedSubmission.validationStatus).toBe('completed');
    });

    it('should update form data', async () => {
      const newFormData = {
        aadhaarNumber: '987654321098',
        otp: '654321',
        verified: true,
      };

      const updatedSubmission = await prisma.formSubmission.update({
        where: { id: testSubmission.id },
        data: { formData: newFormData },
      });

      expect(updatedSubmission.formData).toEqual(newFormData);
    });
  });

  describe('FormSubmission Indexes', () => {
    it('should efficiently query by user and step combination', async () => {
      // Create multiple users and submissions
      const users = await Promise.all([
        prisma.user.create({ data: { sessionId: 'user-1' } }),
        prisma.user.create({ data: { sessionId: 'user-2' } }),
      ]);

      await Promise.all([
        prisma.formSubmission.create({
          data: {
            userId: users[0].id,
            stepNumber: 1,
            formData: { test: 'data1' },
          },
        }),
        prisma.formSubmission.create({
          data: {
            userId: users[0].id,
            stepNumber: 2,
            formData: { test: 'data2' },
          },
        }),
        prisma.formSubmission.create({
          data: {
            userId: users[1].id,
            stepNumber: 1,
            formData: { test: 'data3' },
          },
        }),
      ]);

      // Query should use the idx_user_step index
      const submissions = await prisma.formSubmission.findMany({
        where: {
          userId: users[0].id,
          stepNumber: 1,
        },
      });

      expect(submissions).toHaveLength(1);
      expect(submissions[0].formData.test).toBe('data1');
    });

    it('should efficiently query by submission date', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      await prisma.formSubmission.create({
        data: {
          userId: testUser.id,
          stepNumber: 1,
          formData: { test: 'recent' },
        },
      });

      // Query should use the idx_submission_date index
      const recentSubmissions = await prisma.formSubmission.findMany({
        where: {
          submittedAt: {
            gte: yesterday,
          },
        },
      });

      expect(recentSubmissions.length).toBeGreaterThan(0);
    });
  });

  describe('FormSubmission Aggregations', () => {
    beforeEach(async () => {
      await prisma.formSubmission.createMany({
        data: [
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'data1' },
            validationStatus: 'completed',
          },
          {
            userId: testUser.id,
            stepNumber: 1,
            formData: { test: 'data2' },
            validationStatus: 'pending',
          },
          {
            userId: testUser.id,
            stepNumber: 2,
            formData: { test: 'data3' },
            validationStatus: 'completed',
          },
        ],
      });
    });

    it('should group submissions by step number', async () => {
      const groupedSubmissions = await prisma.formSubmission.groupBy({
        by: ['stepNumber'],
        _count: { id: true },
        orderBy: { stepNumber: 'asc' },
      });

      expect(groupedSubmissions).toHaveLength(2);
      expect(groupedSubmissions[0].stepNumber).toBe(1);
      expect(groupedSubmissions[0]._count.id).toBe(2);
      expect(groupedSubmissions[1].stepNumber).toBe(2);
      expect(groupedSubmissions[1]._count.id).toBe(1);
    });

    it('should group submissions by validation status', async () => {
      const groupedSubmissions = await prisma.formSubmission.groupBy({
        by: ['validationStatus'],
        _count: { id: true },
      });

      const completedGroup = groupedSubmissions.find(
        g => g.validationStatus === 'completed'
      );
      const pendingGroup = groupedSubmissions.find(
        g => g.validationStatus === 'pending'
      );

      expect(completedGroup._count.id).toBe(2);
      expect(pendingGroup._count.id).toBe(1);
    });
  });
});
/**
 * @fileoverview Unit tests for User model
 */

const { PrismaClient } = require('@prisma/client');

describe('User Model', () => {
  let prisma;

  beforeAll(() => {
    prisma = global.testPrisma;
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        sessionId: 'test-session-123',
        status: 'in_progress',
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user).toMatchObject({
        sessionId: 'test-session-123',
        status: 'in_progress',
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with default status', async () => {
      const userData = {
        sessionId: 'test-session-456',
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user.status).toBe('in_progress');
    });

    it('should enforce unique session ID constraint', async () => {
      const userData = {
        sessionId: 'duplicate-session',
      };

      await prisma.user.create({ data: userData });

      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow();
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      await prisma.user.createMany({
        data: [
          { sessionId: 'session-1', status: 'in_progress' },
          { sessionId: 'session-2', status: 'completed' },
          { sessionId: 'session-3', status: 'in_progress' },
        ],
      });
    });

    it('should find user by session ID', async () => {
      const user = await prisma.user.findUnique({
        where: { sessionId: 'session-1' },
      });

      expect(user).toBeTruthy();
      expect(user.sessionId).toBe('session-1');
    });

    it('should find users by status', async () => {
      const users = await prisma.user.findMany({
        where: { status: 'in_progress' },
      });

      expect(users).toHaveLength(2);
      expect(users.every(user => user.status === 'in_progress')).toBe(true);
    });

    it('should count users', async () => {
      const count = await prisma.user.count();
      expect(count).toBe(3);
    });
  });

  describe('User Updates', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          sessionId: 'update-test-session',
          status: 'in_progress',
        },
      });
    });

    it('should update user status', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'completed' },
      });

      expect(updatedUser.status).toBe('completed');
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        testUser.updatedAt.getTime()
      );
    });

    it('should update multiple fields', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          status: 'completed',
          sessionId: 'new-session-id',
        },
      });

      expect(updatedUser.status).toBe('completed');
      expect(updatedUser.sessionId).toBe('new-session-id');
    });
  });

  describe('User Deletion', () => {
    it('should delete a user', async () => {
      const user = await prisma.user.create({
        data: { sessionId: 'delete-test-session' },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(deletedUser).toBeNull();
    });

    it('should cascade delete related form submissions', async () => {
      const user = await prisma.user.create({
        data: { sessionId: 'cascade-test-session' },
      });

      await prisma.formSubmission.create({
        data: {
          userId: user.id,
          stepNumber: 1,
          formData: { test: 'data' },
        },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const submissions = await prisma.formSubmission.findMany({
        where: { userId: user.id },
      });

      expect(submissions).toHaveLength(0);
    });
  });
});
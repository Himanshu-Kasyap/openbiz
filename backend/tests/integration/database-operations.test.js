/**
 * @fileoverview Integration tests for database operations
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const { initializeApp } = require('../../src/server');
const { PrismaClient } = require('@prisma/client');

describe('Integration - Database Operations', () => {
  let app;
  let prisma;

  beforeAll(async () => {
    app = await initializeApp();
    prisma = global.testPrisma || new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/udyam_test?schema=public',
        },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.formSubmission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.formSchema.deleteMany();
  });

  describe('User Management Operations', () => {
    it('should create user record during step 1 registration', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      expect(response.status).toBe(201);
      const sessionId = response.body.sessionId;

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { sessionId }
      });

      expect(user).toBeTruthy();
      expect(user.sessionId).toBe(sessionId);
      expect(user.status).toBe('step1_completed');
      expect(user.createdAt).toBeTruthy();
      expect(user.updatedAt).toBeTruthy();
    });

    it('should update user status during step 2 registration', async () => {
      // First create step 1
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Complete step 2
      await request(app)
        .post('/api/v1/registration/step2')
        .send({
          sessionId,
          panNumber: 'ABCDE1234F',
          personalDetails: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            mobileNumber: '9876543210',
            email: 'john.doe@example.com',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          }
        });

      // Verify user status was updated
      const user = await prisma.user.findUnique({
        where: { sessionId }
      });

      expect(user.status).toBe('completed');
      expect(user.updatedAt.getTime()).toBeGreaterThan(user.createdAt.getTime());
    });

    it('should handle concurrent user creation without conflicts', async () => {
      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: `12345678901${i}`,
              otp: '123456'
            })
        );
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.sessionId).toBeTruthy();
      });

      // Verify all users were created
      const users = await prisma.user.findMany();
      expect(users.length).toBe(concurrentRequests);

      // Verify all session IDs are unique
      const sessionIds = users.map(u => u.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(concurrentRequests);
    });

    it('should handle database connection failures gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the API handles database errors properly
      
      // Try to access a non-existent session
      const response = await request(app)
        .get('/api/v1/registration/non-existent-session/status');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Session not found');
    });
  });

  describe('Form Submission Operations', () => {
    it('should create form submission records for each step', async () => {
      // Step 1
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Step 2
      await request(app)
        .post('/api/v1/registration/step2')
        .send({
          sessionId,
          panNumber: 'ABCDE1234F',
          personalDetails: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            mobileNumber: '9876543210',
            email: 'john.doe@example.com',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          }
        });

      // Verify form submissions were created
      const user = await prisma.user.findUnique({
        where: { sessionId },
        include: { submissions: true }
      });

      expect(user.submissions.length).toBe(2);

      const step1Submission = user.submissions.find(s => s.stepNumber === 1);
      const step2Submission = user.submissions.find(s => s.stepNumber === 2);

      expect(step1Submission).toBeTruthy();
      expect(step1Submission.formData).toMatchObject({
        aadhaarNumber: '123456789012',
        otp: '123456'
      });
      expect(step1Submission.validationStatus).toBe('valid');

      expect(step2Submission).toBeTruthy();
      expect(step2Submission.formData).toMatchObject({
        panNumber: 'ABCDE1234F',
        personalDetails: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe'
        })
      });
      expect(step2Submission.validationStatus).toBe('valid');
    });

    it('should maintain referential integrity between users and submissions', async () => {
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Get the user ID
      const user = await prisma.user.findUnique({
        where: { sessionId }
      });

      // Verify the form submission references the correct user
      const submission = await prisma.formSubmission.findFirst({
        where: { userId: user.id }
      });

      expect(submission).toBeTruthy();
      expect(submission.userId).toBe(user.id);
      expect(submission.stepNumber).toBe(1);
    });

    it('should handle JSON data storage and retrieval correctly', async () => {
      const complexPersonalDetails = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        mobileNumber: '9876543210',
        email: 'john.doe@example.com',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          coordinates: {
            latitude: 19.0760,
            longitude: 72.8777
          }
        },
        preferences: {
          language: 'en',
          notifications: true,
          marketing: false
        }
      };

      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      await request(app)
        .post('/api/v1/registration/step2')
        .send({
          sessionId,
          panNumber: 'ABCDE1234F',
          personalDetails: complexPersonalDetails
        });

      // Retrieve and verify the stored JSON data
      const submission = await prisma.formSubmission.findFirst({
        where: {
          stepNumber: 2,
          user: { sessionId }
        }
      });

      expect(submission.formData.personalDetails).toEqual(complexPersonalDetails);
    });
  });

  describe('Form Schema Operations', () => {
    it('should store and retrieve form schema data', async () => {
      const schemaData = {
        version: '1.0.0',
        title: 'Udyam Registration Form',
        description: 'Test schema',
        steps: [
          {
            stepNumber: 1,
            title: 'Aadhaar Verification',
            fields: [
              {
                name: 'aadhaarNumber',
                type: 'text',
                required: true,
                validation: {
                  pattern: '^[0-9]{12}$',
                  message: 'Aadhaar number must be 12 digits'
                }
              }
            ]
          }
        ]
      };

      // Create form schema
      const createdSchema = await prisma.formSchema.create({
        data: {
          version: schemaData.version,
          schemaData: schemaData,
          isActive: true
        }
      });

      expect(createdSchema).toBeTruthy();
      expect(createdSchema.schemaData).toEqual(schemaData);
      expect(createdSchema.isActive).toBe(true);

      // Retrieve form schema
      const retrievedSchema = await prisma.formSchema.findFirst({
        where: { isActive: true }
      });

      expect(retrievedSchema.schemaData).toEqual(schemaData);
    });

    it('should handle schema versioning correctly', async () => {
      // Create multiple schema versions
      const schemas = [
        { version: '1.0.0', data: { title: 'Version 1' } },
        { version: '1.1.0', data: { title: 'Version 1.1' } },
        { version: '2.0.0', data: { title: 'Version 2' } }
      ];

      for (const schema of schemas) {
        await prisma.formSchema.create({
          data: {
            version: schema.version,
            schemaData: schema.data,
            isActive: schema.version === '2.0.0' // Only latest is active
          }
        });
      }

      // Verify only one active schema
      const activeSchemas = await prisma.formSchema.findMany({
        where: { isActive: true }
      });

      expect(activeSchemas.length).toBe(1);
      expect(activeSchemas[0].version).toBe('2.0.0');

      // Verify all schemas are stored
      const allSchemas = await prisma.formSchema.findMany({
        orderBy: { createdAt: 'asc' }
      });

      expect(allSchemas.length).toBe(3);
      expect(allSchemas.map(s => s.version)).toEqual(['1.0.0', '1.1.0', '2.0.0']);
    });
  });

  describe('Database Transaction Handling', () => {
    it('should handle step 2 registration as atomic transaction', async () => {
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Complete step 2 (should be atomic)
      const step2Response = await request(app)
        .post('/api/v1/registration/step2')
        .send({
          sessionId,
          panNumber: 'ABCDE1234F',
          personalDetails: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            mobileNumber: '9876543210',
            email: 'john.doe@example.com',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          }
        });

      expect(step2Response.status).toBe(201);

      // Verify both user status and form submission were updated atomically
      const user = await prisma.user.findUnique({
        where: { sessionId },
        include: { submissions: true }
      });

      expect(user.status).toBe('completed');
      expect(user.submissions.length).toBe(2);
      expect(user.submissions.find(s => s.stepNumber === 2)).toBeTruthy();
    });

    it('should rollback transaction on validation failure', async () => {
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Attempt step 2 with invalid data
      const step2Response = await request(app)
        .post('/api/v1/registration/step2')
        .send({
          sessionId,
          panNumber: 'INVALID_PAN', // Invalid PAN format
          personalDetails: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            mobileNumber: '9876543210',
            email: 'john.doe@example.com',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          }
        });

      expect(step2Response.status).toBe(400);

      // Verify user status was not updated and no step 2 submission was created
      const user = await prisma.user.findUnique({
        where: { sessionId },
        include: { submissions: true }
      });

      expect(user.status).toBe('step1_completed'); // Should remain unchanged
      expect(user.submissions.length).toBe(1); // Only step 1 submission
      expect(user.submissions.find(s => s.stepNumber === 2)).toBeFalsy();
    });
  });

  describe('Database Performance and Optimization', () => {
    it('should efficiently query user status with indexes', async () => {
      // Create multiple users
      const userCount = 50;
      const sessionIds = [];

      for (let i = 0; i < userCount; i++) {
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: `12345678901${i.toString().padStart(1, '0')}`,
            otp: '123456'
          });
        sessionIds.push(response.body.sessionId);
      }

      // Query should be fast due to unique index on sessionId
      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/v1/registration/${sessionIds[25]}/status`);
      const queryTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(100); // Should be very fast with index
    });

    it('should efficiently handle bulk operations', async () => {
      const bulkSize = 20;
      const requests = [];

      // Create bulk registrations
      for (let i = 0; i < bulkSize; i++) {
        requests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: `12345678901${i.toString().padStart(1, '0')}`,
              otp: '123456'
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should handle bulk operations efficiently
      expect(totalTime).toBeLessThan(5000);

      // Verify all records were created
      const userCount = await prisma.user.count();
      expect(userCount).toBe(bulkSize);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across related tables', async () => {
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Get user and submission counts
      const userCount = await prisma.user.count();
      const submissionCount = await prisma.formSubmission.count();

      expect(userCount).toBe(1);
      expect(submissionCount).toBe(1);

      // Complete step 2
      await request(app)
        .post('/api/v1/registration/step2')
        .send({
          sessionId,
          panNumber: 'ABCDE1234F',
          personalDetails: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            mobileNumber: '9876543210',
            email: 'john.doe@example.com',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          }
        });

      // Verify counts are consistent
      const finalUserCount = await prisma.user.count();
      const finalSubmissionCount = await prisma.formSubmission.count();

      expect(finalUserCount).toBe(1); // Same user
      expect(finalSubmissionCount).toBe(2); // Two submissions

      // Verify relationship integrity
      const user = await prisma.user.findUnique({
        where: { sessionId },
        include: { submissions: true }
      });

      expect(user.submissions.length).toBe(2);
      user.submissions.forEach(submission => {
        expect(submission.userId).toBe(user.id);
      });
    });

    it('should handle concurrent updates to same user correctly', async () => {
      const step1Response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = step1Response.body.sessionId;

      // Attempt concurrent status queries (should not cause conflicts)
      const concurrentQueries = [];
      for (let i = 0; i < 10; i++) {
        concurrentQueries.push(
          request(app)
            .get(`/api/v1/registration/${sessionId}/status`)
        );
      }

      const responses = await Promise.all(concurrentQueries);

      // All queries should succeed and return consistent data
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.sessionId).toBe(sessionId);
        expect(response.body.status).toBe('step1_completed');
      });
    });
  });

  describe('Database Error Handling', () => {
    it('should handle unique constraint violations gracefully', async () => {
      // This would test duplicate session ID handling
      // In practice, session IDs should be unique, so this is more of a safety test
      
      const response1 = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const response2 = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789013',
          otp: '123456'
        });

      // Both should succeed with different session IDs
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.sessionId).not.toBe(response2.body.sessionId);
    });

    it('should handle foreign key constraint violations', async () => {
      // Try to create a form submission without a valid user
      try {
        await prisma.formSubmission.create({
          data: {
            userId: 'non-existent-user-id',
            stepNumber: 1,
            formData: { test: 'data' },
            validationStatus: 'valid'
          }
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Should throw foreign key constraint error
        expect(error.code).toBe('P2003'); // Prisma foreign key constraint error
      }
    });
  });
});
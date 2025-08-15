/**
 * @fileoverview Tests for registration API endpoints
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const { app } = require('../../src/server');
const { prisma } = require('../../src/config/database');

describe('Registration API Endpoints', () => {
  let server;
  let testSessionId;

  beforeAll(async () => {
    // Initialize the app
    const { initializeApp } = require('../../src/server');
    server = await initializeApp();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.formSubmission.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.formSubmission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/registration/step1', () => {
    const validStep1Data = {
      aadhaarNumber: '123456789012',
      otp: '123456'
    };

    it('should successfully process step 1 with valid data', async () => {
      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send(validStep1Data)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        nextStep: 2,
        message: 'Aadhaar verification completed successfully'
      });
      expect(response.body.sessionId).toBeDefined();
      expect(typeof response.body.sessionId).toBe('string');

      testSessionId = response.body.sessionId;
    });

    it('should reject invalid Aadhaar number format', async () => {
      const invalidData = {
        ...validStep1Data,
        aadhaarNumber: '12345' // Too short
      };

      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'aadhaarNumber',
            message: 'Aadhaar number must be exactly 12 digits'
          })
        ])
      );
    });

    it('should reject invalid OTP format', async () => {
      const invalidData = {
        ...validStep1Data,
        otp: '12345' // Too short
      };

      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'otp',
            message: 'OTP must be exactly 6 digits'
          })
        ])
      );
    });

    it('should reject invalid OTP value', async () => {
      const invalidData = {
        ...validStep1Data,
        otp: '999999' // Invalid OTP
      };

      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid OTP. Please check and try again.');
    });

    it('should handle missing required fields', async () => {
      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fields).toHaveLength(2);
    });

    it('should accept existing session ID', async () => {
      // First create a session
      const firstResponse = await request(server)
        .post('/api/v1/registration/step1')
        .send(validStep1Data)
        .expect(201);

      const sessionId = firstResponse.body.sessionId;

      // Use the same session ID
      const secondResponse = await request(server)
        .post('/api/v1/registration/step1')
        .send({
          ...validStep1Data,
          sessionId
        })
        .expect(201);

      expect(secondResponse.body.sessionId).toBe(sessionId);
    });
  });

  describe('POST /api/v1/registration/step2', () => {
    const validStep2Data = {
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
    };

    beforeEach(async () => {
      // Create a valid step 1 session first
      const step1Response = await request(server)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });
      
      testSessionId = step1Response.body.sessionId;
      validStep2Data.sessionId = testSessionId;
    });

    it('should successfully process step 2 with valid data', async () => {
      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(validStep2Data)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        sessionId: testSessionId,
        status: 'completed',
        message: 'Registration completed successfully'
      });
    });

    it('should reject invalid PAN format', async () => {
      const invalidData = {
        ...validStep2Data,
        panNumber: 'INVALID123' // Invalid format
      };

      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'panNumber',
            message: 'PAN number must follow format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)'
          })
        ])
      );
    });

    it('should reject invalid session ID', async () => {
      const invalidData = {
        ...validStep2Data,
        sessionId: 'invalid_session_id'
      };

      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid session. Please start from Step 1.');
    });

    it('should reject invalid mobile number format', async () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          mobileNumber: '1234567890' // Invalid - doesn't start with 6-9
        }
      };

      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          email: 'invalid-email'
        }
      };

      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject future date of birth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          dateOfBirth: futureDate.toISOString().split('T')[0]
        }
      };

      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid PIN code format', async () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          address: {
            ...validStep2Data.personalDetails.address,
            pincode: '12345' // Too short
          }
        }
      };

      const response = await request(server)
        .post('/api/v1/registration/step2')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/registration/:sessionId/status', () => {
    beforeEach(async () => {
      // Create a valid step 1 session
      const step1Response = await request(server)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });
      
      testSessionId = step1Response.body.sessionId;
    });

    it('should return status for valid session after step 1', async () => {
      const response = await request(server)
        .get(`/api/v1/registration/${testSessionId}/status`)
        .expect(200);

      expect(response.body).toMatchObject({
        sessionId: testSessionId,
        status: 'step1_completed',
        currentStep: 2,
        steps: {
          step1: {
            completed: true
          },
          step2: {
            completed: false
          }
        }
      });
      expect(response.body.steps.step1.completedAt).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return completed status after both steps', async () => {
      // Complete step 2
      await request(server)
        .post('/api/v1/registration/step2')
        .send({
          sessionId: testSessionId,
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

      const response = await request(server)
        .get(`/api/v1/registration/${testSessionId}/status`)
        .expect(200);

      expect(response.body).toMatchObject({
        sessionId: testSessionId,
        status: 'completed',
        currentStep: 2,
        steps: {
          step1: {
            completed: true
          },
          step2: {
            completed: true
          }
        }
      });
    });

    it('should return 400 for invalid session ID', async () => {
      const response = await request(server)
        .get('/api/v1/registration/invalid_session/status')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Session not found');
    });
  });

  describe('POST /api/v1/registration/validate-field', () => {
    it('should validate Aadhaar number correctly', async () => {
      const validResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'aadhaarNumber',
          value: '123456789012'
        })
        .expect(200);

      expect(validResponse.body).toMatchObject({
        field: 'aadhaarNumber',
        value: '123456789012',
        isValid: true,
        message: 'Valid Aadhaar number'
      });

      const invalidResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'aadhaarNumber',
          value: '12345'
        })
        .expect(200);

      expect(invalidResponse.body.isValid).toBe(false);
    });

    it('should validate PAN number correctly', async () => {
      const validResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'panNumber',
          value: 'ABCDE1234F'
        })
        .expect(200);

      expect(validResponse.body).toMatchObject({
        field: 'panNumber',
        value: 'ABCDE1234F',
        isValid: true,
        message: 'Valid PAN number'
      });

      const invalidResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'panNumber',
          value: 'INVALID123'
        })
        .expect(200);

      expect(invalidResponse.body.isValid).toBe(false);
    });

    it('should validate mobile number correctly', async () => {
      const validResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'mobileNumber',
          value: '9876543210'
        })
        .expect(200);

      expect(validResponse.body.isValid).toBe(true);

      const invalidResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'mobileNumber',
          value: '1234567890'
        })
        .expect(200);

      expect(invalidResponse.body.isValid).toBe(false);
    });

    it('should validate email correctly', async () => {
      const validResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'email',
          value: 'test@example.com'
        })
        .expect(200);

      expect(validResponse.body.isValid).toBe(true);

      const invalidResponse = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'email',
          value: 'invalid-email'
        })
        .expect(200);

      expect(invalidResponse.body.isValid).toBe(false);
    });

    it('should reject invalid field names', async () => {
      const response = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({
          field: 'invalidField',
          value: 'test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle missing required fields', async () => {
      const response = await request(server)
        .post('/api/v1/registration/validate-field')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(server)
        .post('/api/v1/registration/step1')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle missing Content-Type', async () => {
      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send('aadhaarNumber=123456789012&otp=123456')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should include request ID in error responses', async () => {
      const response = await request(server)
        .post('/api/v1/registration/step1')
        .send({})
        .expect(400);

      expect(response.body.error.requestId).toBeDefined();
      expect(typeof response.body.error.requestId).toBe('string');
    });
  });
});
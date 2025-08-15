/**
 * @fileoverview Unit tests for RegistrationService
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const RegistrationService = require('../../src/services/registrationService');
const { prisma } = require('../../src/config/database');
const { ValidationError, DatabaseError } = require('../../src/middleware/errorHandler');

describe('RegistrationService', () => {
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

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = RegistrationService.generateSessionId();
      const id2 = RegistrationService.generateSessionId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^udyam_\d+_[a-z0-9]+$/);
    });
  });

  describe('verifyAadhaarOTP', () => {
    it('should accept valid test OTPs', async () => {
      const result1 = await RegistrationService.verifyAadhaarOTP('123456789012', '123456');
      const result2 = await RegistrationService.verifyAadhaarOTP('123456789012', '000000');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should accept OTP matching last 6 digits of Aadhaar', async () => {
      const result = await RegistrationService.verifyAadhaarOTP('123456789012', '789012');
      expect(result).toBe(true);
    });

    it('should reject invalid OTPs', async () => {
      const result = await RegistrationService.verifyAadhaarOTP('123456789012', '999999');
      expect(result).toBe(false);
    });
  });

  describe('verifyPAN', () => {
    it('should accept valid PAN numbers', async () => {
      const result = await RegistrationService.verifyPAN('ABCDE1234F');
      expect(result).toBe(true);
    });

    it('should reject invalid test PANs', async () => {
      const result1 = await RegistrationService.verifyPAN('INVALID01A');
      const result2 = await RegistrationService.verifyPAN('TEST12345');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should be case insensitive', async () => {
      const result = await RegistrationService.verifyPAN('invalid01a');
      expect(result).toBe(false);
    });
  });

  describe('processStep1', () => {
    const validStep1Data = {
      aadhaarNumber: '123456789012',
      otp: '123456'
    };

    it('should create new user and session for valid data', async () => {
      const result = await RegistrationService.processStep1(validStep1Data);
      
      expect(result).toMatchObject({
        success: true,
        nextStep: 2,
        message: 'Aadhaar verification completed successfully'
      });
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toMatch(/^udyam_\d+_[a-z0-9]+$/);

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { sessionId: result.sessionId }
      });
      expect(user).toBeDefined();
      expect(user.status).toBe('step1_completed');

      // Verify form submission was created
      const submission = await prisma.formSubmission.findFirst({
        where: { userId: user.id, stepNumber: 1 }
      });
      expect(submission).toBeDefined();
      expect(submission.validationStatus).toBe('completed');
    });

    it('should update existing user when sessionId provided', async () => {
      // First create a user
      const firstResult = await RegistrationService.processStep1(validStep1Data);
      
      // Process again with same session ID
      const secondResult = await RegistrationService.processStep1({
        ...validStep1Data,
        sessionId: firstResult.sessionId
      });
      
      expect(secondResult.sessionId).toBe(firstResult.sessionId);
      
      // Verify only one user exists
      const users = await prisma.user.findMany({
        where: { sessionId: firstResult.sessionId }
      });
      expect(users).toHaveLength(1);
    });

    it('should throw ValidationError for invalid OTP', async () => {
      const invalidData = {
        ...validStep1Data,
        otp: '999999'
      };

      await expect(RegistrationService.processStep1(invalidData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should mask Aadhaar number in stored data', async () => {
      const result = await RegistrationService.processStep1(validStep1Data);
      
      const submission = await prisma.formSubmission.findFirst({
        where: { stepNumber: 1 },
        include: { user: true }
      });
      
      expect(submission.formData.aadhaarNumber).toBe('********9012');
    });
  });

  describe('processStep2', () => {
    let testSessionId;
    
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
      // Create a valid step 1 session
      const step1Result = await RegistrationService.processStep1({
        aadhaarNumber: '123456789012',
        otp: '123456'
      });
      testSessionId = step1Result.sessionId;
      validStep2Data.sessionId = testSessionId;
    });

    it('should complete step 2 for valid data', async () => {
      const result = await RegistrationService.processStep2(validStep2Data);
      
      expect(result).toMatchObject({
        success: true,
        sessionId: testSessionId,
        status: 'completed',
        message: 'Registration completed successfully'
      });

      // Verify user status updated
      const user = await prisma.user.findUnique({
        where: { sessionId: testSessionId }
      });
      expect(user.status).toBe('step2_completed');

      // Verify form submission created
      const submission = await prisma.formSubmission.findFirst({
        where: { userId: user.id, stepNumber: 2 }
      });
      expect(submission).toBeDefined();
      expect(submission.validationStatus).toBe('completed');
      expect(submission.formData.panNumber).toBe('ABCDE1234F');
    });

    it('should throw ValidationError for invalid session', async () => {
      const invalidData = {
        ...validStep2Data,
        sessionId: 'invalid_session'
      };

      await expect(RegistrationService.processStep2(invalidData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid PAN', async () => {
      const invalidData = {
        ...validStep2Data,
        panNumber: 'INVALID01A'
      };

      await expect(RegistrationService.processStep2(invalidData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should require step 1 completion', async () => {
      // Create user without step 1 completion
      const user = await prisma.user.create({
        data: {
          sessionId: 'test_session_no_step1',
          status: 'in_progress'
        }
      });

      const invalidData = {
        ...validStep2Data,
        sessionId: user.sessionId
      };

      await expect(RegistrationService.processStep2(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getRegistrationStatus', () => {
    let testSessionId;

    beforeEach(async () => {
      // Create a valid step 1 session
      const step1Result = await RegistrationService.processStep1({
        aadhaarNumber: '123456789012',
        otp: '123456'
      });
      testSessionId = step1Result.sessionId;
    });

    it('should return correct status after step 1', async () => {
      const status = await RegistrationService.getRegistrationStatus(testSessionId);
      
      expect(status).toMatchObject({
        sessionId: testSessionId,
        status: 'step1_completed',
        currentStep: 2,
        steps: {
          step1: {
            completed: true
          },
          step2: {
            completed: false,
            completedAt: null
          }
        }
      });
      expect(status.steps.step1.completedAt).toBeDefined();
      expect(status.createdAt).toBeDefined();
      expect(status.updatedAt).toBeDefined();
    });

    it('should return completed status after both steps', async () => {
      // Complete step 2
      await RegistrationService.processStep2({
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

      const status = await RegistrationService.getRegistrationStatus(testSessionId);
      
      expect(status).toMatchObject({
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
      expect(status.steps.step2.completedAt).toBeDefined();
    });

    it('should throw ValidationError for invalid session', async () => {
      await expect(RegistrationService.getRegistrationStatus('invalid_session'))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('validateField', () => {
    it('should validate Aadhaar number correctly', async () => {
      const validResult = await RegistrationService.validateField('aadhaarNumber', '123456789012');
      expect(validResult).toMatchObject({
        field: 'aadhaarNumber',
        value: '123456789012',
        isValid: true,
        message: 'Valid Aadhaar number'
      });

      const invalidResult = await RegistrationService.validateField('aadhaarNumber', '12345');
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate PAN number correctly', async () => {
      const validResult = await RegistrationService.validateField('panNumber', 'ABCDE1234F');
      expect(validResult).toMatchObject({
        field: 'panNumber',
        value: 'ABCDE1234F',
        isValid: true,
        message: 'Valid PAN number'
      });

      const invalidResult = await RegistrationService.validateField('panNumber', 'INVALID123');
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate OTP correctly', async () => {
      const validResult = await RegistrationService.validateField('otp', '123456');
      expect(validResult.isValid).toBe(true);

      const invalidResult = await RegistrationService.validateField('otp', '12345');
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate mobile number correctly', async () => {
      const validResult = await RegistrationService.validateField('mobileNumber', '9876543210');
      expect(validResult.isValid).toBe(true);

      const invalidResult = await RegistrationService.validateField('mobileNumber', '1234567890');
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate email correctly', async () => {
      const validResult = await RegistrationService.validateField('email', 'test@example.com');
      expect(validResult.isValid).toBe(true);

      const invalidResult = await RegistrationService.validateField('email', 'invalid-email');
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate PIN code correctly', async () => {
      const validResult = await RegistrationService.validateField('pincode', '400001');
      expect(validResult.isValid).toBe(true);

      const invalidResult = await RegistrationService.validateField('pincode', '12345');
      expect(invalidResult.isValid).toBe(false);
    });

    it('should throw ValidationError for invalid field name', async () => {
      await expect(RegistrationService.validateField('invalidField', 'test'))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
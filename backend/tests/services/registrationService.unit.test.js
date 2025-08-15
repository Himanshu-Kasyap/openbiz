/**
 * @fileoverview Unit tests for RegistrationService (non-database functions)
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const RegistrationService = require('../../src/services/registrationService');

describe('RegistrationService Unit Tests', () => {
  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = RegistrationService.generateSessionId();
      const id2 = RegistrationService.generateSessionId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^udyam_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^udyam_\d+_[a-z0-9]+$/);
    });

    it('should generate session IDs with correct format', () => {
      const sessionId = RegistrationService.generateSessionId();
      
      expect(sessionId).toMatch(/^udyam_\d{13}_[a-z0-9]{9}$/);
      expect(sessionId.startsWith('udyam_')).toBe(true);
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

    it('should handle different Aadhaar numbers correctly', async () => {
      const result1 = await RegistrationService.verifyAadhaarOTP('987654321098', '321098');
      const result2 = await RegistrationService.verifyAadhaarOTP('987654321098', '999999');
      
      expect(result1).toBe(true); // Matches last 6 digits
      expect(result2).toBe(false); // Doesn't match
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

    it('should be case insensitive for invalid PANs', async () => {
      const result = await RegistrationService.verifyPAN('invalid01a');
      expect(result).toBe(false);
    });

    it('should accept most valid format PANs', async () => {
      const validPANs = ['ABCDE1234F', 'XYZPQ5678R', 'MNOPQ9876S'];
      
      for (const pan of validPANs) {
        const result = await RegistrationService.verifyPAN(pan);
        expect(result).toBe(true);
      }
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
      expect(invalidResult.message).toBe('Aadhaar number must be exactly 12 digits');
    });

    it('should validate PAN number correctly', async () => {
      const validResult = await RegistrationService.validateField('panNumber', 'ABCDE1234F');
      expect(validResult).toMatchObject({
        field: 'panNumber',
        value: 'ABCDE1234F',
        isValid: true,
        message: 'Valid PAN number'
      });

      const invalidFormatResult = await RegistrationService.validateField('panNumber', 'INVALID123');
      expect(invalidFormatResult.isValid).toBe(false);
      expect(invalidFormatResult.message).toBe('PAN number must follow format: 5 letters, 4 digits, 1 letter');
    });

    it('should validate OTP correctly', async () => {
      const validResult = await RegistrationService.validateField('otp', '123456');
      expect(validResult).toMatchObject({
        field: 'otp',
        value: '123456',
        isValid: true,
        message: 'Valid OTP format'
      });

      const invalidResult = await RegistrationService.validateField('otp', '12345');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBe('OTP must be exactly 6 digits');
    });

    it('should validate mobile number correctly', async () => {
      const validNumbers = ['9876543210', '6876543210', '7876543210', '8876543210'];
      
      for (const number of validNumbers) {
        const result = await RegistrationService.validateField('mobileNumber', number);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('Valid mobile number');
      }

      const invalidResult = await RegistrationService.validateField('mobileNumber', '1234567890');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBe('Mobile number must be 10 digits starting with 6, 7, 8, or 9');
    });

    it('should validate email correctly', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.in', 'admin@company.org'];
      
      for (const email of validEmails) {
        const result = await RegistrationService.validateField('email', email);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('Valid email address');
      }

      const invalidResult = await RegistrationService.validateField('email', 'invalid-email');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBe('Please provide a valid email address');
    });

    it('should validate PIN code correctly', async () => {
      const validResult = await RegistrationService.validateField('pincode', '400001');
      expect(validResult).toMatchObject({
        field: 'pincode',
        value: '400001',
        isValid: true,
        message: 'Valid PIN code'
      });

      const invalidResult = await RegistrationService.validateField('pincode', '12345');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBe('PIN code must be exactly 6 digits');
    });

    it('should throw ValidationError for invalid field name', async () => {
      await expect(RegistrationService.validateField('invalidField', 'test'))
        .rejects
        .toThrow('Invalid field name');
    });

    it('should handle edge cases', async () => {
      // Test empty values
      const emptyResult = await RegistrationService.validateField('aadhaarNumber', '');
      expect(emptyResult.isValid).toBe(false);

      // Test whitespace
      const whitespaceResult = await RegistrationService.validateField('email', '  ');
      expect(whitespaceResult.isValid).toBe(false);
    });
  });
});
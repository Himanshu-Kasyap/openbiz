/**
 * @fileoverview Tests for registration validation schemas
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const {
  step1Schema,
  step2Schema,
  sessionIdParamSchema,
  fieldValidationSchema,
  patterns
} = require('../../src/schemas/registration');

describe('Registration Validation Schemas', () => {
  describe('step1Schema', () => {
    const validStep1Data = {
      aadhaarNumber: '123456789012',
      otp: '123456'
    };

    it('should validate correct step 1 data', () => {
      const { error, value } = step1Schema.validate(validStep1Data);
      expect(error).toBeUndefined();
      expect(value).toEqual(validStep1Data);
    });

    it('should accept optional sessionId', () => {
      const dataWithSession = {
        ...validStep1Data,
        sessionId: 'test_session_123'
      };
      
      const { error, value } = step1Schema.validate(dataWithSession);
      expect(error).toBeUndefined();
      expect(value).toEqual(dataWithSession);
    });

    it('should reject invalid Aadhaar number format', () => {
      const invalidData = {
        ...validStep1Data,
        aadhaarNumber: '12345' // Too short
      };
      
      const { error } = step1Schema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Aadhaar number must be exactly 12 digits');
    });

    it('should reject non-numeric Aadhaar number', () => {
      const invalidData = {
        ...validStep1Data,
        aadhaarNumber: '12345678901a' // Contains letter
      };
      
      const { error } = step1Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid OTP format', () => {
      const invalidData = {
        ...validStep1Data,
        otp: '12345' // Too short
      };
      
      const { error } = step1Schema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('OTP must be exactly 6 digits');
    });

    it('should reject missing required fields', () => {
      const { error } = step1Schema.validate({});
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(1); // At least aadhaarNumber is required
      const fieldNames = error.details.map(d => d.path[0]);
      expect(fieldNames).toContain('aadhaarNumber');
    });
  });

  describe('step2Schema', () => {
    const validStep2Data = {
      sessionId: 'test_session_123',
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

    it('should validate correct step 2 data', () => {
      const { error, value } = step2Schema.validate(validStep2Data);
      expect(error).toBeUndefined();
      expect(value.sessionId).toBe(validStep2Data.sessionId);
      expect(value.panNumber).toBe(validStep2Data.panNumber);
      expect(value.personalDetails.firstName).toBe(validStep2Data.personalDetails.firstName);
      // Date gets converted to Date object by Joi
      expect(value.personalDetails.dateOfBirth).toBeInstanceOf(Date);
    });

    it('should reject invalid PAN format', () => {
      const invalidData = {
        ...validStep2Data,
        panNumber: 'INVALID123' // Wrong format
      };
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('PAN number must follow format');
    });

    it('should reject invalid mobile number', () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          mobileNumber: '1234567890' // Doesn't start with 6-9
        }
      };
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          email: 'invalid-email'
        }
      };
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject future date of birth', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          dateOfBirth: futureDate.toISOString().split('T')[0]
        }
      };
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid gender', () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          gender: 'invalid'
        }
      };
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid PIN code', () => {
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
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject names with numbers', () => {
      const invalidData = {
        ...validStep2Data,
        personalDetails: {
          ...validStep2Data.personalDetails,
          firstName: 'John123'
        }
      };
      
      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('sessionIdParamSchema', () => {
    it('should validate valid session ID', () => {
      const { error, value } = sessionIdParamSchema.validate({
        sessionId: 'test_session_123'
      });
      
      expect(error).toBeUndefined();
      expect(value.sessionId).toBe('test_session_123');
    });

    it('should reject empty session ID', () => {
      const { error } = sessionIdParamSchema.validate({
        sessionId: ''
      });
      
      expect(error).toBeDefined();
    });

    it('should reject missing session ID', () => {
      const { error } = sessionIdParamSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('fieldValidationSchema', () => {
    it('should validate valid field validation request', () => {
      const validData = {
        field: 'aadhaarNumber',
        value: '123456789012'
      };
      
      const { error, value } = fieldValidationSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject invalid field name', () => {
      const invalidData = {
        field: 'invalidField',
        value: 'test'
      };
      
      const { error } = fieldValidationSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing field name', () => {
      const { error } = fieldValidationSchema.validate({
        value: 'test'
      });
      
      expect(error).toBeDefined();
    });

    it('should reject missing value', () => {
      const { error } = fieldValidationSchema.validate({
        field: 'aadhaarNumber'
      });
      
      expect(error).toBeDefined();
    });
  });

  describe('patterns', () => {
    it('should validate Aadhaar pattern correctly', () => {
      expect(patterns.AADHAAR_PATTERN.test('123456789012')).toBe(true);
      expect(patterns.AADHAAR_PATTERN.test('12345678901')).toBe(false); // Too short
      expect(patterns.AADHAAR_PATTERN.test('1234567890123')).toBe(false); // Too long
      expect(patterns.AADHAAR_PATTERN.test('12345678901a')).toBe(false); // Contains letter
    });

    it('should validate PAN pattern correctly', () => {
      expect(patterns.PAN_PATTERN.test('ABCDE1234F')).toBe(true);
      expect(patterns.PAN_PATTERN.test('abcde1234f')).toBe(true); // Case insensitive in regex
      expect(patterns.PAN_PATTERN.test('ABCD1234F')).toBe(false); // Too few letters at start
      expect(patterns.PAN_PATTERN.test('ABCDE123F')).toBe(false); // Too few digits
      expect(patterns.PAN_PATTERN.test('ABCDE1234')).toBe(false); // Missing letter at end
    });

    it('should validate OTP pattern correctly', () => {
      expect(patterns.OTP_PATTERN.test('123456')).toBe(true);
      expect(patterns.OTP_PATTERN.test('12345')).toBe(false); // Too short
      expect(patterns.OTP_PATTERN.test('1234567')).toBe(false); // Too long
      expect(patterns.OTP_PATTERN.test('12345a')).toBe(false); // Contains letter
    });

    it('should validate mobile pattern correctly', () => {
      expect(patterns.MOBILE_PATTERN.test('9876543210')).toBe(true);
      expect(patterns.MOBILE_PATTERN.test('6876543210')).toBe(true);
      expect(patterns.MOBILE_PATTERN.test('7876543210')).toBe(true);
      expect(patterns.MOBILE_PATTERN.test('8876543210')).toBe(true);
      expect(patterns.MOBILE_PATTERN.test('5876543210')).toBe(false); // Doesn't start with 6-9
      expect(patterns.MOBILE_PATTERN.test('987654321')).toBe(false); // Too short
      expect(patterns.MOBILE_PATTERN.test('98765432100')).toBe(false); // Too long
    });

    it('should validate PIN code pattern correctly', () => {
      expect(patterns.PINCODE_PATTERN.test('400001')).toBe(true);
      expect(patterns.PINCODE_PATTERN.test('40000')).toBe(false); // Too short
      expect(patterns.PINCODE_PATTERN.test('4000011')).toBe(false); // Too long
      expect(patterns.PINCODE_PATTERN.test('40000a')).toBe(false); // Contains letter
    });
  });
});
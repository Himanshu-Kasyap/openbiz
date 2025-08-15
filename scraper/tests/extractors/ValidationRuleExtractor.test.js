/**
 * @fileoverview Unit tests for ValidationRuleExtractor
 */

const ValidationRuleExtractor = require('../../src/extractors/ValidationRuleExtractor');

describe('ValidationRuleExtractor', () => {
  let extractor;
  let mockPage;

  beforeEach(() => {
    extractor = new ValidationRuleExtractor();
    
    // Mock Puppeteer page
    mockPage = {
      evaluate: jest.fn()
    };
  });

  describe('extractValidationRules', () => {
    it('should extract validation rules for required field', async () => {
      const field = {
        id: 'test_input',
        name: 'testInput',
        type: 'text',
        label: 'Test Input',
        required: true
      };

      mockPage.evaluate.mockResolvedValue([]);

      const rules = await extractor.extractValidationRules(mockPage, field);

      expect(rules).toContainEqual({
        type: 'required',
        value: true,
        message: 'Test Input is required'
      });
    });

    it('should extract validation rules for Aadhaar field', async () => {
      const field = {
        id: 'aadhaar_input',
        name: 'aadhaarNumber',
        type: 'text',
        label: 'Aadhaar Number',
        required: true
      };

      mockPage.evaluate.mockResolvedValue([]);

      const rules = await extractor.extractValidationRules(mockPage, field);

      expect(rules).toContainEqual({
        type: 'required',
        value: true,
        message: 'Aadhaar Number is required'
      });

      expect(rules).toContainEqual({
        type: 'pattern',
        value: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      });
    });

    it('should extract validation rules for PAN field', async () => {
      const field = {
        id: 'pan_input',
        name: 'panNumber',
        type: 'text',
        label: 'PAN Number',
        required: true
      };

      mockPage.evaluate.mockResolvedValue([]);

      const rules = await extractor.extractValidationRules(mockPage, field);

      expect(rules).toContainEqual({
        type: 'pattern',
        value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
        message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
      });
    });

    it('should handle extraction errors gracefully', async () => {
      const field = {
        id: 'test_input',
        name: 'testInput',
        type: 'text',
        label: 'Test Input',
        required: false
      };

      mockPage.evaluate.mockRejectedValue(new Error('Page evaluation failed'));

      const rules = await extractor.extractValidationRules(mockPage, field);

      // Should return fallback rules
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('extractClientSideValidation', () => {
    it('should extract HTML5 validation attributes', async () => {
      const field = { id: 'test_input', name: 'testInput' };

      mockPage.evaluate.mockResolvedValue([
        {
          type: 'pattern',
          value: '^[0-9]+$',
          message: 'Numbers only'
        },
        {
          type: 'length',
          value: { min: 5 },
          message: 'Minimum length is 5'
        }
      ]);

      const rules = await extractor.extractClientSideValidation(mockPage, field);

      expect(rules).toHaveLength(2);
      expect(rules[0]).toEqual({
        type: 'pattern',
        value: '^[0-9]+$',
        message: 'Numbers only'
      });
    });

    it('should handle missing elements', async () => {
      const field = { id: 'nonexistent', name: 'nonexistent' };

      mockPage.evaluate.mockResolvedValue([]);

      const rules = await extractor.extractClientSideValidation(mockPage, field);

      expect(rules).toEqual([]);
    });

    it('should handle page evaluation errors', async () => {
      const field = { id: 'test_input', name: 'testInput' };

      mockPage.evaluate.mockRejectedValue(new Error('Evaluation failed'));

      const rules = await extractor.extractClientSideValidation(mockPage, field);

      expect(rules).toEqual([]);
    });
  });

  describe('getPatternValidation', () => {
    it('should return Aadhaar pattern for Aadhaar fields', () => {
      const field = {
        id: 'aadhaar_input',
        name: 'aadhaarNumber',
        label: 'Aadhaar Number'
      };

      const rule = extractor.getPatternValidation(field);

      expect(rule).toEqual({
        type: 'pattern',
        value: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      });
    });

    it('should return PAN pattern for PAN fields', () => {
      const field = {
        id: 'pan_input',
        name: 'panNumber',
        label: 'PAN Number'
      };

      const rule = extractor.getPatternValidation(field);

      expect(rule).toEqual({
        type: 'pattern',
        value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
        message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
      });
    });

    it('should return OTP pattern for OTP fields', () => {
      const field = {
        id: 'otp_input',
        name: 'otp',
        label: 'OTP'
      };

      const rule = extractor.getPatternValidation(field);

      expect(rule).toEqual({
        type: 'pattern',
        value: '^[0-9]{6}$',
        message: 'OTP must be 6 digits'
      });
    });

    it('should return mobile pattern for mobile fields', () => {
      const field = {
        id: 'mobile_input',
        name: 'mobileNumber',
        label: 'Mobile Number'
      };

      const rule = extractor.getPatternValidation(field);

      expect(rule).toEqual({
        type: 'pattern',
        value: '^[6-9][0-9]{9}$',
        message: 'Mobile number must be 10 digits starting with 6-9'
      });
    });

    it('should return email pattern for email fields', () => {
      const field = {
        id: 'email_input',
        name: 'email',
        type: 'email'
      };

      const rule = extractor.getPatternValidation(field);

      expect(rule).toEqual({
        type: 'pattern',
        value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        message: 'Please enter a valid email address'
      });
    });

    it('should return null for unknown field types', () => {
      const field = {
        id: 'unknown_input',
        name: 'unknownField',
        label: 'Unknown Field'
      };

      const rule = extractor.getPatternValidation(field);

      expect(rule).toBeNull();
    });
  });

  describe('extractLengthValidation', () => {
    it('should extract min and max length', async () => {
      const field = { id: 'test_input', name: 'testInput' };

      mockPage.evaluate.mockResolvedValue({
        min: 5,
        max: 20
      });

      const rule = await extractor.extractLengthValidation(mockPage, field);

      expect(rule).toEqual({
        type: 'length',
        value: { min: 5, max: 20 },
        message: 'Must be between 5 and 20 characters'
      });
    });

    it('should extract only min length', async () => {
      const field = { id: 'test_input', name: 'testInput' };

      mockPage.evaluate.mockResolvedValue({
        min: 10
      });

      const rule = await extractor.extractLengthValidation(mockPage, field);

      expect(rule).toEqual({
        type: 'length',
        value: { min: 10 },
        message: 'Must be at least 10 characters'
      });
    });

    it('should extract only max length', async () => {
      const field = { id: 'test_input', name: 'testInput' };

      mockPage.evaluate.mockResolvedValue({
        max: 50
      });

      const rule = await extractor.extractLengthValidation(mockPage, field);

      expect(rule).toEqual({
        type: 'length',
        value: { max: 50 },
        message: 'Must be no more than 50 characters'
      });
    });

    it('should return null when no length constraints found', async () => {
      const field = { id: 'test_input', name: 'testInput' };

      mockPage.evaluate.mockResolvedValue(null);

      const rule = await extractor.extractLengthValidation(mockPage, field);

      expect(rule).toBeNull();
    });
  });

  describe('generateLengthMessage', () => {
    it('should generate message for exact length', () => {
      const message = extractor.generateLengthMessage({ min: 12, max: 12 });
      expect(message).toBe('Must be exactly 12 characters');
    });

    it('should generate message for range', () => {
      const message = extractor.generateLengthMessage({ min: 5, max: 20 });
      expect(message).toBe('Must be between 5 and 20 characters');
    });

    it('should generate message for minimum only', () => {
      const message = extractor.generateLengthMessage({ min: 8 });
      expect(message).toBe('Must be at least 8 characters');
    });

    it('should generate message for maximum only', () => {
      const message = extractor.generateLengthMessage({ max: 100 });
      expect(message).toBe('Must be no more than 100 characters');
    });

    it('should handle empty length info', () => {
      const message = extractor.generateLengthMessage({});
      expect(message).toBe('Invalid length');
    });
  });

  describe('removeDuplicateRules', () => {
    it('should remove duplicate rules', () => {
      const rules = [
        { type: 'required', value: true, message: 'Required' },
        { type: 'pattern', value: '^[0-9]+$', message: 'Numbers only' },
        { type: 'required', value: true, message: 'Required' }, // Duplicate
        { type: 'length', value: { min: 5 }, message: 'Min 5 chars' }
      ];

      const uniqueRules = extractor.removeDuplicateRules(rules);

      expect(uniqueRules).toHaveLength(3);
      expect(uniqueRules.map(r => r.type)).toEqual(['required', 'pattern', 'length']);
    });

    it('should handle empty rules array', () => {
      const uniqueRules = extractor.removeDuplicateRules([]);
      expect(uniqueRules).toEqual([]);
    });
  });

  describe('getFallbackValidationRules', () => {
    it('should return fallback rules for required Aadhaar field', () => {
      const field = {
        id: 'aadhaar_input',
        name: 'aadhaarNumber',
        label: 'Aadhaar Number',
        required: true
      };

      const rules = extractor.getFallbackValidationRules(field);

      expect(rules).toContainEqual({
        type: 'required',
        value: true,
        message: 'Aadhaar Number is required'
      });

      expect(rules).toContainEqual({
        type: 'pattern',
        value: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      });
    });

    it('should return fallback rules for non-required field', () => {
      const field = {
        id: 'optional_input',
        name: 'optionalInput',
        label: 'Optional Input',
        required: false
      };

      const rules = extractor.getFallbackValidationRules(field);

      expect(rules).not.toContainEqual(
        expect.objectContaining({ type: 'required' })
      );
    });

    it('should handle field with alternative Aadhaar spelling', () => {
      const field = {
        id: 'aadhar_input',
        name: 'aadharNumber',
        label: 'Aadhar Number',
        required: true
      };

      const rules = extractor.getFallbackValidationRules(field);

      expect(rules).toContainEqual({
        type: 'pattern',
        value: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      });
    });
  });
});
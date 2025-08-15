/**
 * @fileoverview Unit tests for FormSchemaService
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const FormSchemaService = require('../../src/services/formSchemaService');

// Mock Prisma
const mockPrisma = {
  formSchema: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn()
  }
};

jest.mock('../../src/config/database', () => ({
  prisma: mockPrisma
}));

describe('FormSchemaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFormSchema', () => {
    it('should return database schema when available', async () => {
      const mockDbSchema = {
        id: 'schema-id-1',
        version: '2.0.0',
        schemaData: {
          version: '2.0.0',
          title: 'Database Schema',
          description: 'Schema from database',
          steps: [
            {
              stepNumber: 1,
              title: 'Step 1',
              fields: []
            }
          ],
          metadata: {
            source: 'scraper'
          }
        },
        isActive: true,
        createdAt: new Date()
      };

      mockPrisma.formSchema.findFirst.mockResolvedValue(mockDbSchema);

      const result = await FormSchemaService.getFormSchema();

      expect(result).toEqual({
        ...mockDbSchema.schemaData,
        metadata: {
          ...mockDbSchema.schemaData.metadata,
          source: 'database',
          schemaId: 'schema-id-1',
          version: '2.0.0'
        }
      });

      expect(mockPrisma.formSchema.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return default schema when no database schema exists', async () => {
      mockPrisma.formSchema.findFirst.mockResolvedValue(null);

      const result = await FormSchemaService.getFormSchema();

      expect(result).toEqual(FormSchemaService.DEFAULT_SCHEMA);
    });

    it('should return default schema on database error', async () => {
      mockPrisma.formSchema.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await FormSchemaService.getFormSchema();

      expect(result).toEqual(FormSchemaService.DEFAULT_SCHEMA);
    });
  });

  describe('saveFormSchema', () => {
    it('should save new schema and deactivate old ones', async () => {
      const newSchema = {
        version: '3.0.0',
        title: 'New Schema',
        steps: []
      };

      const mockCreatedSchema = {
        id: 'new-schema-id',
        version: '3.0.0',
        schemaData: newSchema,
        isActive: true
      };

      mockPrisma.formSchema.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.formSchema.create.mockResolvedValue(mockCreatedSchema);

      const result = await FormSchemaService.saveFormSchema(newSchema, '3.0.0');

      expect(mockPrisma.formSchema.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false }
      });

      expect(mockPrisma.formSchema.create).toHaveBeenCalledWith({
        data: {
          version: '3.0.0',
          schemaData: newSchema,
          isActive: true
        }
      });

      expect(result).toEqual({
        success: true,
        schemaId: 'new-schema-id',
        version: '3.0.0',
        message: 'Form schema saved successfully'
      });
    });

    it('should handle database error during save', async () => {
      const newSchema = { version: '3.0.0', title: 'New Schema', steps: [] };

      mockPrisma.formSchema.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.formSchema.create.mockRejectedValue(new Error('Database error'));

      await expect(FormSchemaService.saveFormSchema(newSchema, '3.0.0'))
        .rejects.toThrow('Failed to save form schema');
    });
  });

  describe('getStepSchema', () => {
    it('should return step 1 schema', async () => {
      mockPrisma.formSchema.findFirst.mockResolvedValue(null);

      const result = await FormSchemaService.getStepSchema(1);

      expect(result.stepNumber).toBe(1);
      expect(result.title).toBe('Aadhaar Verification');
      expect(result.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'aadhaarNumber' }),
          expect.objectContaining({ name: 'otp' })
        ])
      );
    });

    it('should return step 2 schema', async () => {
      mockPrisma.formSchema.findFirst.mockResolvedValue(null);

      const result = await FormSchemaService.getStepSchema(2);

      expect(result.stepNumber).toBe(2);
      expect(result.title).toBe('PAN & Personal Details');
      expect(result.fields.length).toBeGreaterThan(5);
    });

    it('should throw error for invalid step number', async () => {
      await expect(FormSchemaService.getStepSchema(0))
        .rejects.toThrow('Step number must be 1 or 2');

      await expect(FormSchemaService.getStepSchema(3))
        .rejects.toThrow('Step number must be 1 or 2');
    });
  });

  describe('getFieldValidationRules', () => {
    beforeEach(() => {
      mockPrisma.formSchema.findFirst.mockResolvedValue(null);
    });

    it('should return validation rules for aadhaarNumber', async () => {
      const rules = await FormSchemaService.getFieldValidationRules('aadhaarNumber');

      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'required',
            value: true,
            message: 'Aadhaar number is required'
          }),
          expect.objectContaining({
            type: 'pattern',
            value: '^\\d{12}$',
            message: 'Aadhaar number must be exactly 12 digits'
          })
        ])
      );
    });

    it('should return validation rules for panNumber', async () => {
      const rules = await FormSchemaService.getFieldValidationRules('panNumber');

      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'required',
            value: true
          }),
          expect.objectContaining({
            type: 'pattern',
            value: '^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$'
          })
        ])
      );
    });

    it('should throw error for non-existent field', async () => {
      await expect(FormSchemaService.getFieldValidationRules('nonExistentField'))
        .rejects.toThrow("Field 'nonExistentField' not found in form schema");
    });
  });

  describe('validateFormData', () => {
    beforeEach(() => {
      mockPrisma.formSchema.findFirst.mockResolvedValue(null);
    });

    it('should validate valid step 1 data', async () => {
      const formData = {
        aadhaarNumber: '123456789012',
        otp: '123456'
      };

      const result = await FormSchemaService.validateFormData(formData, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.validatedData).toEqual(formData);
    });

    it('should validate invalid step 1 data', async () => {
      const formData = {
        aadhaarNumber: '12345', // Invalid length
        otp: '' // Required but empty
      };

      const result = await FormSchemaService.validateFormData(formData, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validatedData).toBeNull();
    });

    it('should validate valid step 2 data', async () => {
      const formData = {
        panNumber: 'ABCDE1234F',
        personalDetails: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          mobileNumber: '9876543210',
          email: 'john@example.com',
          address: {
            street: '123 Main Street',
            pincode: '123456',
            city: 'Test City',
            state: 'Test State'
          }
        }
      };

      const result = await FormSchemaService.validateFormData(formData, 2);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate invalid step 2 data', async () => {
      const formData = {
        panNumber: 'INVALID', // Invalid format
        personalDetails: {
          firstName: 'A', // Too short
          email: 'invalid-email' // Invalid format
        }
      };

      const result = await FormSchemaService.validateFormData(formData, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('applyValidationRule', () => {
    it('should validate required rule', () => {
      const rule = { type: 'required', value: true, message: 'Field is required' };

      expect(FormSchemaService.applyValidationRule('test', rule, {})).toEqual({
        isValid: true,
        message: 'Field is required'
      });

      expect(FormSchemaService.applyValidationRule('', rule, {})).toEqual({
        isValid: false,
        message: 'Field is required'
      });

      expect(FormSchemaService.applyValidationRule(null, rule, {})).toEqual({
        isValid: false,
        message: 'Field is required'
      });
    });

    it('should validate pattern rule', () => {
      const rule = { type: 'pattern', value: '^\\d{6}$', message: 'Must be 6 digits' };

      expect(FormSchemaService.applyValidationRule('123456', rule, {})).toEqual({
        isValid: true,
        message: 'Must be 6 digits'
      });

      expect(FormSchemaService.applyValidationRule('12345', rule, {})).toEqual({
        isValid: false,
        message: 'Must be 6 digits'
      });

      expect(FormSchemaService.applyValidationRule('', rule, {})).toEqual({
        isValid: true,
        message: 'Must be 6 digits'
      });
    });

    it('should validate min length rule', () => {
      const rule = { type: 'min', value: 3, message: 'Minimum 3 characters' };

      expect(FormSchemaService.applyValidationRule('test', rule, {})).toEqual({
        isValid: true,
        message: 'Minimum 3 characters'
      });

      expect(FormSchemaService.applyValidationRule('ab', rule, {})).toEqual({
        isValid: false,
        message: 'Minimum 3 characters'
      });
    });

    it('should validate max length rule', () => {
      const rule = { type: 'max', value: 5, message: 'Maximum 5 characters' };

      expect(FormSchemaService.applyValidationRule('test', rule, {})).toEqual({
        isValid: true,
        message: 'Maximum 5 characters'
      });

      expect(FormSchemaService.applyValidationRule('toolong', rule, {})).toEqual({
        isValid: false,
        message: 'Maximum 5 characters'
      });
    });

    it('should validate exact length rule', () => {
      const rule = { type: 'length', value: 4, message: 'Must be exactly 4 characters' };

      expect(FormSchemaService.applyValidationRule('test', rule, {})).toEqual({
        isValid: true,
        message: 'Must be exactly 4 characters'
      });

      expect(FormSchemaService.applyValidationRule('short', rule, {})).toEqual({
        isValid: false,
        message: 'Must be exactly 4 characters'
      });
    });

    it('should handle unknown rule types', () => {
      const rule = { type: 'unknown', value: 'test', message: 'Unknown rule' };

      expect(FormSchemaService.applyValidationRule('test', rule, {})).toEqual({
        isValid: true,
        message: ''
      });
    });
  });

  describe('getNestedValue', () => {
    it('should get nested object values', () => {
      const obj = {
        personalDetails: {
          address: {
            city: 'Test City'
          }
        }
      };

      expect(FormSchemaService.getNestedValue(obj, 'personalDetails.address.city'))
        .toBe('Test City');

      expect(FormSchemaService.getNestedValue(obj, 'personalDetails.firstName'))
        .toBeUndefined();

      expect(FormSchemaService.getNestedValue(obj, 'nonExistent.path'))
        .toBeUndefined();
    });
  });

  describe('setNestedValue', () => {
    it('should set nested object values', () => {
      const obj = {};

      FormSchemaService.setNestedValue(obj, 'personalDetails.address.city', 'Test City');

      expect(obj).toEqual({
        personalDetails: {
          address: {
            city: 'Test City'
          }
        }
      });
    });

    it('should overwrite existing nested values', () => {
      const obj = {
        personalDetails: {
          address: {
            city: 'Old City'
          }
        }
      };

      FormSchemaService.setNestedValue(obj, 'personalDetails.address.city', 'New City');

      expect(obj.personalDetails.address.city).toBe('New City');
    });
  });

  describe('getSchemaMetadata', () => {
    it('should return schema metadata', async () => {
      mockPrisma.formSchema.findFirst.mockResolvedValue(null);

      const metadata = await FormSchemaService.getSchemaMetadata();

      expect(metadata).toEqual({
        version: FormSchemaService.DEFAULT_SCHEMA.version,
        title: FormSchemaService.DEFAULT_SCHEMA.title,
        description: FormSchemaService.DEFAULT_SCHEMA.description,
        totalSteps: 2,
        totalFields: expect.any(Number),
        metadata: FormSchemaService.DEFAULT_SCHEMA.metadata
      });

      expect(metadata.totalFields).toBeGreaterThan(10);
    });
  });
});
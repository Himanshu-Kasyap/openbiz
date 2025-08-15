/**
 * @fileoverview Unit tests for SchemaGenerator
 */

const SchemaGenerator = require('../../src/generators/SchemaGenerator');

describe('SchemaGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new SchemaGenerator();
  });

  describe('generateSchema', () => {
    it('should generate complete schema from steps data', () => {
      const stepsData = {
        step1: [
          {
            id: 'aadhaar_input',
            name: 'aadhaarNumber',
            type: 'text',
            label: 'Aadhaar Number',
            required: true,
            validationRules: [
              { type: 'pattern', value: '^[0-9]{12}$', message: 'Must be 12 digits' }
            ]
          }
        ],
        step2: [
          {
            id: 'pan_input',
            name: 'panNumber',
            type: 'text',
            label: 'PAN Number',
            required: true,
            validationRules: [
              { type: 'pattern', value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}', message: 'Invalid PAN format' }
            ]
          }
        ]
      };

      const schema = generator.generateSchema(stepsData);

      expect(schema).toHaveProperty('version', '1.0.0');
      expect(schema).toHaveProperty('scrapedAt');
      expect(schema).toHaveProperty('sourceUrl', 'https://udyamregistration.gov.in/UdyamRegistration.aspx');
      expect(schema).toHaveProperty('metadata');
      expect(schema).toHaveProperty('steps');
      expect(schema).toHaveProperty('validationRules');
      expect(schema).toHaveProperty('fieldCategories');
      expect(schema).toHaveProperty('statistics');

      expect(schema.steps.step1).toHaveLength(1);
      expect(schema.steps.step2).toHaveLength(1);
    });

    it('should handle empty steps data', () => {
      const stepsData = {
        step1: [],
        step2: []
      };

      const schema = generator.generateSchema(stepsData);

      expect(schema.steps.step1).toEqual([]);
      expect(schema.steps.step2).toEqual([]);
      expect(schema.metadata.totalFields).toBe(0);
    });

    it('should handle missing steps', () => {
      const stepsData = {};

      const schema = generator.generateSchema(stepsData);

      expect(schema.steps.step1).toEqual([]);
      expect(schema.steps.step2).toEqual([]);
    });
  });

  describe('generateMetadata', () => {
    it('should generate correct metadata', () => {
      const stepsData = {
        step1: [{ id: 'field1' }, { id: 'field2' }],
        step2: [{ id: 'field3' }]
      };

      const metadata = generator.generateMetadata(stepsData);

      expect(metadata.totalSteps).toBe(2);
      expect(metadata.totalFields).toBe(3);
      expect(metadata.steps.step1.fieldCount).toBe(2);
      expect(metadata.steps.step2.fieldCount).toBe(1);
      expect(metadata.description).toBe('Udyam Registration Portal - Steps 1 & 2 Form Schema');
    });

    it('should handle undefined steps', () => {
      const stepsData = {
        step1: undefined,
        step2: null
      };

      const metadata = generator.generateMetadata(stepsData);

      expect(metadata.totalFields).toBe(0);
      expect(metadata.steps.step1.fieldCount).toBe(0);
      expect(metadata.steps.step2.fieldCount).toBe(0);
    });
  });

  describe('processStepFields', () => {
    it('should process fields with metadata', () => {
      const fields = [
        {
          id: 'aadhaar_input',
          name: 'aadhaarNumber',
          type: 'text',
          label: 'Aadhaar Number',
          required: true,
          validationRules: [{ type: 'required' }]
        }
      ];

      const processedFields = generator.processStepFields(fields, 'step1');

      expect(processedFields).toHaveLength(1);
      expect(processedFields[0]).toHaveProperty('stepName', 'step1');
      expect(processedFields[0]).toHaveProperty('fieldIndex', 0);
      expect(processedFields[0]).toHaveProperty('schemaVersion', '1.0.0');
      expect(processedFields[0]).toHaveProperty('metadata');
      expect(processedFields[0].metadata.isRequired).toBe(true);
      expect(processedFields[0].metadata.hasValidation).toBe(true);
    });

    it('should handle non-array fields', () => {
      const processedFields = generator.processStepFields(null, 'step1');
      expect(processedFields).toEqual([]);
    });
  });

  describe('inferFieldCategory', () => {
    it('should infer Aadhaar category', () => {
      const field = { id: 'aadhaar_input', name: 'aadhaarNumber', label: 'Aadhaar Number' };
      const category = generator.inferFieldCategory(field);
      expect(category).toBe('identity_aadhaar');
    });

    it('should infer PAN category', () => {
      const field = { id: 'pan_input', name: 'panNumber', label: 'PAN Number' };
      const category = generator.inferFieldCategory(field);
      expect(category).toBe('identity_pan');
    });

    it('should infer OTP category', () => {
      const field = { id: 'otp_input', name: 'otp', label: 'OTP' };
      const category = generator.inferFieldCategory(field);
      expect(category).toBe('verification_otp');
    });

    it('should infer mobile category', () => {
      const field = { id: 'mobile_input', name: 'mobileNumber', label: 'Mobile Number' };
      const category = generator.inferFieldCategory(field);
      expect(category).toBe('contact_mobile');
    });

    it('should default to general category', () => {
      const field = { id: 'unknown_input', name: 'unknownField', label: 'Unknown Field' };
      const category = generator.inferFieldCategory(field);
      expect(category).toBe('general');
    });
  });

  describe('generateUIHints', () => {
    it('should generate hints for Aadhaar field', () => {
      const field = { 
        id: 'aadhaar_input', 
        name: 'aadhaarNumber', 
        label: 'Aadhaar Number',
        fieldCategory: 'identity_aadhaar'
      };
      
      const hints = generator.generateUIHints(field);
      
      expect(hints.inputMode).toBe('numeric');
      expect(hints.pattern).toBe('[0-9]*');
      expect(hints.placeholder).toBe('Enter 12-digit Aadhaar number');
      expect(hints.maxLength).toBe(12);
    });

    it('should generate hints for PAN field', () => {
      const field = { 
        id: 'pan_input', 
        name: 'panNumber', 
        label: 'PAN Number',
        fieldCategory: 'identity_pan'
      };
      
      const hints = generator.generateUIHints(field);
      
      expect(hints.placeholder).toBe('Enter PAN (e.g., ABCDE1234F)');
      expect(hints.maxLength).toBe(10);
      expect(hints.textTransform).toBe('uppercase');
    });

    it('should generate hints for email field', () => {
      const field = { 
        id: 'email_input', 
        name: 'email', 
        label: 'Email Address'
      };
      
      const hints = generator.generateUIHints(field);
      
      expect(hints.inputMode).toBe('email');
      expect(hints.autoComplete).toBe('email');
    });

    it('should generate default hints', () => {
      const field = { 
        id: 'text_input', 
        name: 'textField', 
        label: 'Text Field'
      };
      
      const hints = generator.generateUIHints(field);
      
      expect(hints.inputMode).toBe('text');
      expect(hints.autoComplete).toBe('off');
      expect(hints.spellCheck).toBe(false);
    });
  });

  describe('extractGlobalValidationRules', () => {
    it('should return global validation rules', () => {
      const stepsData = { step1: [], step2: [] };
      const globalRules = generator.extractGlobalValidationRules(stepsData);

      expect(globalRules).toHaveProperty('aadhaar');
      expect(globalRules).toHaveProperty('pan');
      expect(globalRules).toHaveProperty('otp');
      expect(globalRules).toHaveProperty('mobile');
      expect(globalRules).toHaveProperty('pincode');

      expect(globalRules.aadhaar.pattern).toBe('^[0-9]{12}$');
      expect(globalRules.pan.pattern).toBe('[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}');
    });
  });

  describe('categorizeFields', () => {
    it('should categorize fields correctly', () => {
      const stepsData = {
        step1: [
          { id: 'aadhaar', fieldCategory: 'identity_aadhaar' },
          { id: 'mobile', fieldCategory: 'contact_mobile' }
        ],
        step2: [
          { id: 'pan', fieldCategory: 'identity_pan' },
          { id: 'otp', fieldCategory: 'verification_otp' }
        ]
      };

      const categories = generator.categorizeFields(stepsData);

      expect(categories.identity).toHaveLength(2);
      expect(categories.contact).toHaveLength(1);
      expect(categories.verification).toHaveLength(1);
      expect(categories.location).toHaveLength(0);
    });

    it('should handle fields without categories', () => {
      const stepsData = {
        step1: [
          { id: 'unknown1', name: 'unknown1', label: 'Unknown 1' },
          { id: 'unknown2', name: 'unknown2', label: 'Unknown 2' }
        ],
        step2: []
      };

      const categories = generator.categorizeFields(stepsData);

      expect(categories.general).toHaveLength(2);
    });
  });

  describe('generateStatistics', () => {
    it('should generate correct statistics', () => {
      const schema = {
        steps: {
          step1: [
            {
              type: 'text',
              metadata: { fieldCategory: 'identity_aadhaar' },
              validationRules: [
                { type: 'required' },
                { type: 'pattern' }
              ]
            }
          ],
          step2: [
            {
              type: 'text',
              metadata: { fieldCategory: 'identity_pan' },
              validationRules: [
                { type: 'required' }
              ]
            },
            {
              type: 'select',
              metadata: { fieldCategory: 'location_state' },
              validationRules: []
            }
          ]
        }
      };

      const stats = generator.generateStatistics(schema);

      expect(stats.totalSteps).toBe(2);
      expect(stats.totalFields).toBe(3);
      expect(stats.fieldsByType.text).toBe(2);
      expect(stats.fieldsByType.select).toBe(1);
      expect(stats.fieldsByCategory.identity_aadhaar).toBe(1);
      expect(stats.fieldsByCategory.identity_pan).toBe(1);
      expect(stats.validationRules.total).toBe(3);
      expect(stats.validationRules.byType.required).toBe(2);
      expect(stats.validationRules.byType.pattern).toBe(1);
    });

    it('should handle empty schema', () => {
      const schema = {
        steps: {
          step1: [],
          step2: []
        }
      };

      const stats = generator.generateStatistics(schema);

      expect(stats.totalSteps).toBe(2);
      expect(stats.totalFields).toBe(0);
      expect(stats.fieldsByType).toEqual({});
      expect(stats.validationRules.total).toBe(0);
    });
  });
});
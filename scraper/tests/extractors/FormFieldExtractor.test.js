/**
 * @fileoverview Unit tests for FormFieldExtractor
 */

const FormFieldExtractor = require('../../src/extractors/FormFieldExtractor');

describe('FormFieldExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new FormFieldExtractor();
  });

  describe('processFormElements', () => {
    it('should process valid form elements', async () => {
      const rawElements = [
        {
          id: 'aadhaar_input',
          name: 'aadhaarNumber',
          type: 'text',
          tagName: 'input',
          label: 'Aadhaar Number',
          required: true,
          placeholder: 'Enter Aadhaar Number'
        },
        {
          id: 'pan_input',
          name: 'panNumber',
          type: 'text',
          tagName: 'input',
          label: 'PAN Number',
          required: true
        }
      ];

      const result = await extractor.processFormElements(rawElements, 'step1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('aadhaar_input');
      expect(result[0].fieldCategory).toBe('aadhaar');
      expect(result[1].id).toBe('pan_input');
      expect(result[1].fieldCategory).toBe('pan');
    });

    it('should handle empty elements array', async () => {
      const result = await extractor.processFormElements([], 'step1');
      expect(result).toEqual([]);
    });

    it('should filter out invalid elements', async () => {
      const rawElements = [
        {
          id: 'valid_input',
          name: 'validInput',
          type: 'text',
          tagName: 'input',
          label: 'Valid Input'
        },
        {
          id: 'hidden_input',
          name: 'hiddenInput',
          type: 'hidden',
          tagName: 'input'
        },
        {
          // No id, name, or label
          type: 'text',
          tagName: 'input'
        }
      ];

      const result = await extractor.processFormElements(rawElements, 'step1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid_input');
    });
  });

  describe('processElement', () => {
    it('should process Aadhaar input element', () => {
      const element = {
        id: 'aadhaar_number',
        name: 'aadhaarNumber',
        type: 'text',
        tagName: 'input',
        label: 'Aadhaar Number',
        required: true,
        placeholder: 'Enter 12-digit Aadhaar number'
      };

      const result = extractor.processElement(element, 'step1');

      expect(result.id).toBe('aadhaar_number');
      expect(result.name).toBe('aadhaarNumber');
      expect(result.type).toBe('text');
      expect(result.label).toBe('Aadhaar Number');
      expect(result.required).toBe(true);
      expect(result.fieldCategory).toBe('aadhaar');
      expect(result.validationRules).toContainEqual({
        type: 'pattern',
        value: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      });
    });

    it('should process PAN input element', () => {
      const element = {
        id: 'pan_number',
        name: 'panNumber',
        type: 'text',
        tagName: 'input',
        label: 'PAN Number',
        required: true
      };

      const result = extractor.processElement(element, 'step2');

      expect(result.fieldCategory).toBe('pan');
      expect(result.validationRules).toContainEqual({
        type: 'pattern',
        value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
        message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
      });
    });

    it('should process select element with options', () => {
      const element = {
        id: 'state_select',
        name: 'state',
        type: 'select',
        tagName: 'select',
        label: 'State',
        required: true,
        options: [
          { value: '', text: 'Select State' },
          { value: 'MH', text: 'Maharashtra' },
          { value: 'KA', text: 'Karnataka' }
        ]
      };

      const result = extractor.processElement(element, 'step2');

      expect(result.type).toBe('select');
      expect(result.options).toHaveLength(2); // Empty option filtered out
      expect(result.options[0]).toEqual({ value: 'MH', text: 'Maharashtra' });
    });
  });

  describe('shouldSkipElement', () => {
    it('should skip hidden elements', () => {
      const element = { id: 'hidden_field', type: 'hidden' };
      expect(extractor.shouldSkipElement(element)).toBe(true);
    });

    it('should skip elements without identifiers', () => {
      const element = { type: 'text', tagName: 'input' };
      expect(extractor.shouldSkipElement(element)).toBe(true);
    });

    it('should skip CAPTCHA elements', () => {
      const element = { id: 'captcha_input', name: 'captcha', type: 'text' };
      expect(extractor.shouldSkipElement(element)).toBe(true);
    });

    it('should skip CSRF token elements', () => {
      const element = { id: 'csrf_token', name: '__VIEWSTATE', type: 'hidden' };
      expect(extractor.shouldSkipElement(element)).toBe(true);
    });

    it('should not skip valid elements', () => {
      const element = { id: 'valid_input', name: 'validInput', type: 'text', label: 'Valid Input' };
      expect(extractor.shouldSkipElement(element)).toBe(false);
    });
  });

  describe('mapFieldType', () => {
    it('should map input types correctly', () => {
      expect(extractor.mapFieldType('text', 'input')).toBe('text');
      expect(extractor.mapFieldType('email', 'input')).toBe('text');
      expect(extractor.mapFieldType('password', 'input')).toBe('text');
      expect(extractor.mapFieldType('select-one', 'select')).toBe('select');
      expect(extractor.mapFieldType('radio', 'input')).toBe('radio');
      expect(extractor.mapFieldType('checkbox', 'input')).toBe('checkbox');
      expect(extractor.mapFieldType('submit', 'input')).toBe('button');
    });

    it('should handle textarea elements', () => {
      expect(extractor.mapFieldType('textarea', 'textarea')).toBe('text');
    });

    it('should default to text for unknown types', () => {
      expect(extractor.mapFieldType('unknown', 'input')).toBe('text');
    });
  });

  describe('cleanId', () => {
    it('should clean ASP.NET control IDs', () => {
      expect(extractor.cleanId('ctl00_ContentPlaceHolder1_txtAadhaar')).toBe('txtaadhaar');
      expect(extractor.cleanId('ctl01_MainContent_panInput')).toBe('paninput');
    });

    it('should handle special characters', () => {
      expect(extractor.cleanId('input-with-dashes')).toBe('input_with_dashes');
      expect(extractor.cleanId('input.with.dots')).toBe('input_with_dots');
    });

    it('should handle empty or null IDs', () => {
      expect(extractor.cleanId('')).toBe('');
      expect(extractor.cleanId(null)).toBe('');
      expect(extractor.cleanId(undefined)).toBe('');
    });
  });

  describe('cleanLabel', () => {
    it('should clean label text', () => {
      expect(extractor.cleanLabel('Aadhaar Number *')).toBe('Aadhaar Number');
      expect(extractor.cleanLabel('PAN Number:')).toBe('PAN Number');
      expect(extractor.cleanLabel('  Mobile   Number  ')).toBe('Mobile Number');
    });

    it('should handle empty labels', () => {
      expect(extractor.cleanLabel('')).toBe('');
      expect(extractor.cleanLabel(null)).toBe('');
    });
  });

  describe('enhanceFieldMetadata', () => {
    it('should enhance Aadhaar field metadata', () => {
      const field = {
        id: 'aadhaar_input',
        name: 'aadhaarNumber',
        type: 'text',
        label: 'Aadhaar Number',
        required: true,
        validationRules: []
      };
      const element = { id: 'aadhaar_input', name: 'aadhaarNumber' };

      extractor.enhanceFieldMetadata(field, element);

      expect(field.fieldCategory).toBe('aadhaar');
      expect(field.expectedFormat).toBe('12-digit number');
      expect(field.validationRules).toContainEqual({
        type: 'pattern',
        value: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      });
    });

    it('should enhance OTP field metadata', () => {
      const field = {
        id: 'otp_input',
        name: 'otp',
        type: 'text',
        label: 'OTP',
        required: true,
        validationRules: []
      };
      const element = { id: 'otp_input', name: 'otp' };

      extractor.enhanceFieldMetadata(field, element);

      expect(field.fieldCategory).toBe('otp');
      expect(field.expectedFormat).toBe('6-digit number');
    });

    it('should add required validation rule', () => {
      const field = {
        id: 'test_input',
        name: 'testInput',
        type: 'text',
        label: 'Test Input',
        required: true,
        validationRules: []
      };
      const element = { id: 'test_input', name: 'testInput' };

      extractor.enhanceFieldMetadata(field, element);

      expect(field.validationRules).toContainEqual({
        type: 'required',
        value: true,
        message: 'Test Input is required'
      });
    });
  });

  describe('isValidFormField', () => {
    it('should validate fields with ID and name', () => {
      const field = { id: 'test', name: 'test', type: 'text' };
      expect(extractor.isValidFormField(field)).toBe(true);
    });

    it('should validate fields with only ID', () => {
      const field = { id: 'test', type: 'text' };
      expect(extractor.isValidFormField(field)).toBe(true);
    });

    it('should validate fields with only name', () => {
      const field = { name: 'test', type: 'text' };
      expect(extractor.isValidFormField(field)).toBe(true);
    });

    it('should reject fields without ID or name', () => {
      const field = { type: 'text' };
      expect(extractor.isValidFormField(field)).toBe(false);
    });

    it('should reject fields with invalid type', () => {
      const field = { id: 'test', type: 'invalid' };
      expect(extractor.isValidFormField(field)).toBe(false);
    });

    it('should reject non-submit buttons', () => {
      const field = { id: 'test', type: 'button', label: 'Cancel' };
      expect(extractor.isValidFormField(field)).toBe(false);
    });

    it('should accept submit buttons', () => {
      const field = { id: 'test', type: 'button', label: 'Submit Form' };
      expect(extractor.isValidFormField(field)).toBe(true);
    });
  });

  describe('removeDuplicateFields', () => {
    it('should remove duplicate fields', () => {
      const fields = [
        { id: 'test1', name: 'test1', type: 'text' },
        { id: 'test2', name: 'test2', type: 'text' },
        { id: 'test1', name: 'test1', type: 'text' }, // Duplicate
        { id: 'test3', name: 'test3', type: 'select' }
      ];

      const result = extractor.removeDuplicateFields(fields);

      expect(result).toHaveLength(3);
      expect(result.map(f => f.id)).toEqual(['test1', 'test2', 'test3']);
    });

    it('should handle empty array', () => {
      const result = extractor.removeDuplicateFields([]);
      expect(result).toEqual([]);
    });
  });
});
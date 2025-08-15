/**
 * @fileoverview Form field extractor for processing scraped form elements
 */

const logger = require('../utils/logger');

/**
 * @typedef {Object} RawFormElement
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} tagName
 * @property {string} className
 * @property {string} placeholder
 * @property {boolean} required
 * @property {boolean} disabled
 * @property {string} value
 * @property {string} label
 * @property {Array} [options]
 */

/**
 * @typedef {Object} ProcessedFormField
 * @property {string} id
 * @property {string} name
 * @property {'text'|'select'|'radio'|'checkbox'|'button'} type
 * @property {string} label
 * @property {string} [placeholder]
 * @property {boolean} required
 * @property {Array} validationRules
 * @property {Array} [options]
 */

class FormFieldExtractor {
  constructor() {
    this.fieldTypeMapping = {
      'text': 'text',
      'email': 'text',
      'tel': 'text',
      'number': 'text',
      'password': 'text',
      'select': 'select',
      'select-one': 'select',
      'radio': 'radio',
      'checkbox': 'checkbox',
      'button': 'button',
      'submit': 'button',
      'textarea': 'text'
    };
  }

  /**
   * Process raw form elements into structured form fields
   * @param {RawFormElement[]} rawElements - Raw elements from page evaluation
   * @param {string} stepName - Name of the step (step1, step2)
   * @returns {Promise<ProcessedFormField[]>}
   */
  async processFormElements(rawElements, stepName) {
    try {
      logger.info(`Processing ${rawElements.length} raw elements for ${stepName}`);
      
      const processedFields = [];
      
      for (const element of rawElements) {
        const processedField = this.processElement(element, stepName);
        
        if (processedField && this.isValidFormField(processedField)) {
          processedFields.push(processedField);
        }
      }
      
      // Remove duplicates and clean up
      const uniqueFields = this.removeDuplicateFields(processedFields);
      
      logger.info(`Processed ${uniqueFields.length} valid fields for ${stepName}`);
      return uniqueFields;
      
    } catch (error) {
      logger.error(`Failed to process form elements for ${stepName}:`, error);
      throw error;
    }
  }

  /**
   * Process a single form element
   * @param {RawFormElement} element - Raw element data
   * @param {string} stepName - Step name
   * @returns {ProcessedFormField|null}
   */
  processElement(element, stepName) {
    try {
      // Skip elements that are clearly not form fields
      if (this.shouldSkipElement(element)) {
        return null;
      }

      const processedField = {
        id: this.cleanId(element.id),
        name: this.cleanName(element.name || element.id),
        type: this.mapFieldType(element.type, element.tagName),
        label: this.cleanLabel(element.label),
        placeholder: element.placeholder || '',
        required: Boolean(element.required),
        validationRules: [],
        step: stepName
      };

      // Add options for select elements
      if (element.options && Array.isArray(element.options)) {
        processedField.options = element.options
          .filter(option => option.value !== '' || option.text.trim() !== '')
          .map(option => ({
            value: option.value,
            text: option.text.trim()
          }));
      }

      // Enhance field based on patterns in id, name, or label
      this.enhanceFieldMetadata(processedField, element);

      return processedField;

    } catch (error) {
      logger.warn(`Failed to process element ${element.id}:`, error.message);
      return null;
    }
  }

  /**
   * Check if element should be skipped
   * @param {RawFormElement} element - Element to check
   * @returns {boolean}
   */
  shouldSkipElement(element) {
    // Skip hidden elements
    if (element.type === 'hidden') {
      return true;
    }

    // Skip elements without meaningful identifiers
    if (!element.id && !element.name && !element.label) {
      return true;
    }

    // Skip common non-form elements
    const skipPatterns = [
      'captcha',
      'csrf',
      'token',
      '__VIEWSTATE',
      '__EVENTVALIDATION',
      'search',
      'menu',
      'nav'
    ];

    const elementText = `${element.id} ${element.name} ${element.className}`.toLowerCase();
    
    return skipPatterns.some(pattern => elementText.includes(pattern));
  }

  /**
   * Map element type to standardized field type
   * @param {string} elementType - Original element type
   * @param {string} tagName - Element tag name
   * @returns {string}
   */
  mapFieldType(elementType, tagName) {
    const type = elementType || tagName;
    return this.fieldTypeMapping[type.toLowerCase()] || 'text';
  }

  /**
   * Clean and standardize field ID
   * @param {string} id - Original ID
   * @returns {string}
   */
  cleanId(id) {
    if (!id) return '';
    
    // Remove common prefixes and clean up
    return id
      .replace(/^(ctl\d+_|ContentPlaceHolder\d+_)/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
  }

  /**
   * Clean and standardize field name
   * @param {string} name - Original name
   * @returns {string}
   */
  cleanName(name) {
    if (!name) return '';
    
    return name
      .replace(/^(ctl\d+_|ContentPlaceHolder\d+_)/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
  }

  /**
   * Clean and standardize field label
   * @param {string} label - Original label
   * @returns {string}
   */
  cleanLabel(label) {
    if (!label) return '';
    
    return label
      .replace(/\s+/g, ' ')
      .replace(/[*:]/g, '')
      .trim();
  }

  /**
   * Enhance field metadata based on patterns
   * @param {ProcessedFormField} field - Field to enhance
   * @param {RawFormElement} element - Original element
   */
  enhanceFieldMetadata(field, element) {
    const fieldText = `${field.id} ${field.name} ${field.label}`.toLowerCase();

    // Detect Aadhaar fields
    if (fieldText.includes('aadhaar') || fieldText.includes('aadhar')) {
      field.fieldCategory = 'aadhaar';
      field.expectedFormat = '12-digit number';
      
      if (!field.validationRules.some(rule => rule.type === 'pattern')) {
        field.validationRules.push({
          type: 'pattern',
          value: '^[0-9]{12}$',
          message: 'Aadhaar number must be 12 digits'
        });
      }
    }

    // Detect PAN fields
    if (fieldText.includes('pan')) {
      field.fieldCategory = 'pan';
      field.expectedFormat = 'ABCDE1234F';
      
      if (!field.validationRules.some(rule => rule.type === 'pattern')) {
        field.validationRules.push({
          type: 'pattern',
          value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
          message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
        });
      }
    }

    // Detect OTP fields
    if (fieldText.includes('otp') || fieldText.includes('verification')) {
      field.fieldCategory = 'otp';
      field.expectedFormat = '6-digit number';
      
      if (!field.validationRules.some(rule => rule.type === 'pattern')) {
        field.validationRules.push({
          type: 'pattern',
          value: '^[0-9]{6}$',
          message: 'OTP must be 6 digits'
        });
      }
    }

    // Detect mobile number fields
    if (fieldText.includes('mobile') || fieldText.includes('phone')) {
      field.fieldCategory = 'mobile';
      field.expectedFormat = '10-digit number';
      
      if (!field.validationRules.some(rule => rule.type === 'pattern')) {
        field.validationRules.push({
          type: 'pattern',
          value: '^[6-9][0-9]{9}$',
          message: 'Mobile number must be 10 digits starting with 6-9'
        });
      }
    }

    // Add required validation if field is marked as required
    if (field.required && !field.validationRules.some(rule => rule.type === 'required')) {
      field.validationRules.push({
        type: 'required',
        value: true,
        message: `${field.label || field.name} is required`
      });
    }
  }

  /**
   * Check if processed field is valid
   * @param {ProcessedFormField} field - Field to validate
   * @returns {boolean}
   */
  isValidFormField(field) {
    // Must have either ID or name
    if (!field.id && !field.name) {
      return false;
    }

    // Must have a valid type
    if (!field.type || !Object.values(this.fieldTypeMapping).includes(field.type)) {
      return false;
    }

    // Skip buttons unless they're submit buttons
    if (field.type === 'button' && !field.label.toLowerCase().includes('submit')) {
      return false;
    }

    return true;
  }

  /**
   * Remove duplicate fields based on ID and name
   * @param {ProcessedFormField[]} fields - Fields to deduplicate
   * @returns {ProcessedFormField[]}
   */
  removeDuplicateFields(fields) {
    const seen = new Set();
    const uniqueFields = [];

    for (const field of fields) {
      const key = `${field.id}_${field.name}_${field.type}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFields.push(field);
      }
    }

    return uniqueFields;
  }
}

module.exports = FormFieldExtractor;
/**
 * @fileoverview Schema generator for creating structured form schemas
 */

const logger = require('../utils/logger');

/**
 * @typedef {Object} FormSchema
 * @property {string} version
 * @property {Date} scrapedAt
 * @property {string} sourceUrl
 * @property {Object} metadata
 * @property {Object} steps
 * @property {Array} steps.step1
 * @property {Array} steps.step2
 */

class SchemaGenerator {
  constructor() {
    this.version = '1.0.0';
    this.sourceUrl = 'https://udyamregistration.gov.in/UdyamRegistration.aspx';
  }

  /**
   * Generate complete form schema from extracted data
   * @param {Object} stepsData - Data for all steps
   * @param {Array} stepsData.step1 - Step 1 fields
   * @param {Array} stepsData.step2 - Step 2 fields
   * @returns {FormSchema}
   */
  generateSchema(stepsData) {
    try {
      logger.info('Generating form schema...');

      const schema = {
        version: this.version,
        scrapedAt: new Date().toISOString(),
        sourceUrl: this.sourceUrl,
        metadata: this.generateMetadata(stepsData),
        steps: {
          step1: this.processStepFields(stepsData.step1, 'step1'),
          step2: this.processStepFields(stepsData.step2, 'step2')
        },
        validationRules: this.extractGlobalValidationRules(stepsData),
        fieldCategories: this.categorizeFields(stepsData)
      };

      // Add schema statistics
      schema.statistics = this.generateStatistics(schema);

      logger.info('Form schema generated successfully');
      return schema;

    } catch (error) {
      logger.error('Failed to generate schema:', error);
      throw error;
    }
  }

  /**
   * Generate metadata for the schema
   * @param {Object} stepsData - Steps data
   * @returns {Object}
   */
  generateMetadata(stepsData) {
    const totalFields = (stepsData.step1?.length || 0) + (stepsData.step2?.length || 0);
    
    return {
      totalSteps: 2,
      totalFields: totalFields,
      scrapingMethod: 'puppeteer',
      lastUpdated: new Date().toISOString(),
      description: 'Udyam Registration Portal - Steps 1 & 2 Form Schema',
      steps: {
        step1: {
          name: 'Aadhaar Verification',
          description: 'Aadhaar number verification with OTP',
          fieldCount: stepsData.step1?.length || 0
        },
        step2: {
          name: 'PAN Verification',
          description: 'PAN verification and personal details',
          fieldCount: stepsData.step2?.length || 0
        }
      }
    };
  }

  /**
   * Process fields for a specific step
   * @param {Array} fields - Raw fields array
   * @param {string} stepName - Name of the step
   * @returns {Array}
   */
  processStepFields(fields, stepName) {
    if (!Array.isArray(fields)) {
      logger.warn(`No fields provided for ${stepName}, using empty array`);
      return [];
    }

    return fields.map((field, index) => {
      const processedField = {
        ...field,
        stepName: stepName,
        fieldIndex: index,
        schemaVersion: this.version
      };

      // Add field metadata
      processedField.metadata = {
        isRequired: field.required || false,
        hasValidation: field.validationRules && field.validationRules.length > 0,
        fieldCategory: field.fieldCategory || this.inferFieldCategory(field),
        uiHints: this.generateUIHints(field)
      };

      return processedField;
    });
  }

  /**
   * Infer field category from field properties
   * @param {Object} field - Field object
   * @returns {string}
   */
  inferFieldCategory(field) {
    const fieldText = `${field.id} ${field.name} ${field.label}`.toLowerCase();

    if (fieldText.includes('aadhaar') || fieldText.includes('aadhar')) {
      return 'identity_aadhaar';
    }
    
    if (fieldText.includes('pan')) {
      return 'identity_pan';
    }
    
    if (fieldText.includes('otp') || fieldText.includes('verification')) {
      return 'verification_otp';
    }
    
    if (fieldText.includes('mobile') || fieldText.includes('phone')) {
      return 'contact_mobile';
    }
    
    if (fieldText.includes('email')) {
      return 'contact_email';
    }
    
    if (fieldText.includes('name')) {
      return 'personal_name';
    }
    
    if (fieldText.includes('address')) {
      return 'personal_address';
    }
    
    if (fieldText.includes('pin') || fieldText.includes('postal')) {
      return 'location_pincode';
    }
    
    if (fieldText.includes('city')) {
      return 'location_city';
    }
    
    if (fieldText.includes('state')) {
      return 'location_state';
    }

    return 'general';
  }

  /**
   * Generate UI hints for better frontend rendering
   * @param {Object} field - Field object
   * @returns {Object}
   */
  generateUIHints(field) {
    const hints = {
      inputMode: 'text',
      autoComplete: 'off',
      spellCheck: false
    };

    const fieldText = `${field.id} ${field.name} ${field.label}`.toLowerCase();

    // Set appropriate input modes
    if (fieldText.includes('aadhaar') || fieldText.includes('aadhar') || 
        fieldText.includes('otp') || fieldText.includes('mobile') || 
        fieldText.includes('phone') || fieldText.includes('pin')) {
      hints.inputMode = 'numeric';
      hints.pattern = '[0-9]*';
    }

    if (fieldText.includes('email')) {
      hints.inputMode = 'email';
      hints.autoComplete = 'email';
    }

    if (fieldText.includes('name')) {
      hints.autoComplete = 'name';
      hints.spellCheck = true;
    }

    // Set placeholder hints
    if (field.fieldCategory === 'identity_aadhaar') {
      hints.placeholder = 'Enter 12-digit Aadhaar number';
      hints.maxLength = 12;
    } else if (field.fieldCategory === 'identity_pan') {
      hints.placeholder = 'Enter PAN (e.g., ABCDE1234F)';
      hints.maxLength = 10;
      hints.textTransform = 'uppercase';
    } else if (field.fieldCategory === 'verification_otp') {
      hints.placeholder = 'Enter 6-digit OTP';
      hints.maxLength = 6;
    }

    return hints;
  }

  /**
   * Extract global validation rules that apply across steps
   * @param {Object} stepsData - Steps data
   * @returns {Object}
   */
  extractGlobalValidationRules(stepsData) {
    const globalRules = {
      aadhaar: {
        pattern: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits',
        description: 'Indian Aadhaar number validation'
      },
      pan: {
        pattern: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
        message: 'PAN must be in format: 5 letters, 4 digits, 1 letter',
        description: 'Indian PAN card validation'
      },
      otp: {
        pattern: '^[0-9]{6}$',
        message: 'OTP must be 6 digits',
        description: 'One-time password validation'
      },
      mobile: {
        pattern: '^[6-9][0-9]{9}$',
        message: 'Mobile number must be 10 digits starting with 6-9',
        description: 'Indian mobile number validation'
      },
      pincode: {
        pattern: '^[0-9]{6}$',
        message: 'PIN code must be 6 digits',
        description: 'Indian postal PIN code validation'
      }
    };

    return globalRules;
  }

  /**
   * Categorize all fields by type and purpose
   * @param {Object} stepsData - Steps data
   * @returns {Object}
   */
  categorizeFields(stepsData) {
    const categories = {
      identity: [],
      contact: [],
      location: [],
      verification: [],
      personal: [],
      business: [],
      general: []
    };

    const allFields = [
      ...(stepsData.step1 || []),
      ...(stepsData.step2 || [])
    ];

    allFields.forEach(field => {
      const category = field.fieldCategory || this.inferFieldCategory(field);
      
      if (category.startsWith('identity_')) {
        categories.identity.push(field);
      } else if (category.startsWith('contact_')) {
        categories.contact.push(field);
      } else if (category.startsWith('location_')) {
        categories.location.push(field);
      } else if (category.startsWith('verification_')) {
        categories.verification.push(field);
      } else if (category.startsWith('personal_')) {
        categories.personal.push(field);
      } else if (category.startsWith('business_')) {
        categories.business.push(field);
      } else {
        categories.general.push(field);
      }
    });

    return categories;
  }

  /**
   * Generate statistics about the schema
   * @param {FormSchema} schema - Generated schema
   * @returns {Object}
   */
  generateStatistics(schema) {
    const stats = {
      totalSteps: Object.keys(schema.steps).length,
      totalFields: 0,
      fieldsByType: {},
      fieldsByCategory: {},
      validationRules: {
        total: 0,
        byType: {}
      }
    };

    // Count fields and analyze types
    Object.values(schema.steps).forEach(stepFields => {
      stats.totalFields += stepFields.length;
      
      stepFields.forEach(field => {
        // Count by type
        stats.fieldsByType[field.type] = (stats.fieldsByType[field.type] || 0) + 1;
        
        // Count by category
        const category = field.metadata?.fieldCategory || 'unknown';
        stats.fieldsByCategory[category] = (stats.fieldsByCategory[category] || 0) + 1;
        
        // Count validation rules
        if (field.validationRules) {
          stats.validationRules.total += field.validationRules.length;
          
          field.validationRules.forEach(rule => {
            stats.validationRules.byType[rule.type] = 
              (stats.validationRules.byType[rule.type] || 0) + 1;
          });
        }
      });
    });

    return stats;
  }
}

module.exports = SchemaGenerator;
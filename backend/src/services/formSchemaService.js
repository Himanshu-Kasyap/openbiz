/**
 * @fileoverview Form schema service for serving scraped Udyam form structure
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const { prisma } = require('../config/database');
const logger = require('../config/logger');
const { AppError, DatabaseError, ValidationError } = require('../middleware/errorHandler');

/**
 * @typedef {Object} FormField
 * @property {string} id - Field ID
 * @property {string} name - Field name
 * @property {'text'|'select'|'radio'|'checkbox'|'email'|'tel'|'date'} type - Field type
 * @property {string} label - Field label
 * @property {string} [placeholder] - Field placeholder
 * @property {boolean} required - Whether field is required
 * @property {ValidationRule[]} validationRules - Validation rules
 * @property {SelectOption[]} [options] - Options for select/radio fields
 * @property {Object} [attributes] - Additional HTML attributes
 */

/**
 * @typedef {Object} ValidationRule
 * @property {'pattern'|'length'|'required'|'custom'|'min'|'max'} type - Rule type
 * @property {string|number} value - Rule value
 * @property {string} message - Error message
 */

/**
 * @typedef {Object} SelectOption
 * @property {string} value - Option value
 * @property {string} label - Option label
 * @property {boolean} [disabled] - Whether option is disabled
 */

/**
 * @typedef {Object} FormStep
 * @property {number} stepNumber - Step number
 * @property {string} title - Step title
 * @property {string} description - Step description
 * @property {FormField[]} fields - Form fields in this step
 */

/**
 * @typedef {Object} FormSchema
 * @property {string} version - Schema version
 * @property {string} title - Form title
 * @property {string} description - Form description
 * @property {FormStep[]} steps - Form steps
 * @property {Object} metadata - Additional metadata
 */

/**
 * Form schema service class
 */
class FormSchemaService {
  /**
   * Default form schema (fallback when no scraped data available)
   * @type {FormSchema}
   */
  static DEFAULT_SCHEMA = {
    version: '1.0.0',
    title: 'Udyam Registration Form',
    description: 'Replica of the official Udyam registration process - Steps 1 & 2',
    steps: [
      {
        stepNumber: 1,
        title: 'Aadhaar Verification',
        description: 'Verify your identity using Aadhaar number and OTP',
        fields: [
          {
            id: 'aadhaarNumber',
            name: 'aadhaarNumber',
            type: 'text',
            label: 'Aadhaar Number',
            placeholder: 'Enter 12-digit Aadhaar number',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Aadhaar number is required'
              },
              {
                type: 'pattern',
                value: '^\\d{12}$',
                message: 'Aadhaar number must be exactly 12 digits'
              },
              {
                type: 'length',
                value: 12,
                message: 'Aadhaar number must be exactly 12 digits'
              }
            ],
            attributes: {
              maxLength: 12,
              inputMode: 'numeric',
              autoComplete: 'off'
            }
          },
          {
            id: 'otp',
            name: 'otp',
            type: 'text',
            label: 'OTP',
            placeholder: 'Enter 6-digit OTP',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'OTP is required'
              },
              {
                type: 'pattern',
                value: '^\\d{6}$',
                message: 'OTP must be exactly 6 digits'
              },
              {
                type: 'length',
                value: 6,
                message: 'OTP must be exactly 6 digits'
              }
            ],
            attributes: {
              maxLength: 6,
              inputMode: 'numeric',
              autoComplete: 'one-time-code'
            }
          }
        ]
      },
      {
        stepNumber: 2,
        title: 'PAN & Personal Details',
        description: 'Provide PAN details and personal information',
        fields: [
          {
            id: 'panNumber',
            name: 'panNumber',
            type: 'text',
            label: 'PAN Number',
            placeholder: 'Enter PAN number (e.g., ABCDE1234F)',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'PAN number is required'
              },
              {
                type: 'pattern',
                value: '^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$',
                message: 'PAN number must follow format: 5 letters, 4 digits, 1 letter'
              }
            ],
            attributes: {
              maxLength: 10,
              textTransform: 'uppercase',
              autoComplete: 'off'
            }
          },
          {
            id: 'firstName',
            name: 'personalDetails.firstName',
            type: 'text',
            label: 'First Name',
            placeholder: 'Enter first name',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'First name is required'
              },
              {
                type: 'min',
                value: 2,
                message: 'First name must be at least 2 characters'
              },
              {
                type: 'max',
                value: 50,
                message: 'First name cannot exceed 50 characters'
              },
              {
                type: 'pattern',
                value: '^[A-Za-z\\s]+$',
                message: 'First name can only contain letters and spaces'
              }
            ],
            attributes: {
              maxLength: 50,
              autoComplete: 'given-name'
            }
          },
          {
            id: 'lastName',
            name: 'personalDetails.lastName',
            type: 'text',
            label: 'Last Name',
            placeholder: 'Enter last name',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Last name is required'
              },
              {
                type: 'min',
                value: 2,
                message: 'Last name must be at least 2 characters'
              },
              {
                type: 'max',
                value: 50,
                message: 'Last name cannot exceed 50 characters'
              },
              {
                type: 'pattern',
                value: '^[A-Za-z\\s]+$',
                message: 'Last name can only contain letters and spaces'
              }
            ],
            attributes: {
              maxLength: 50,
              autoComplete: 'family-name'
            }
          },
          {
            id: 'dateOfBirth',
            name: 'personalDetails.dateOfBirth',
            type: 'date',
            label: 'Date of Birth',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Date of birth is required'
              },
              {
                type: 'max',
                value: new Date().toISOString().split('T')[0],
                message: 'Date of birth cannot be in the future'
              }
            ],
            attributes: {
              max: new Date().toISOString().split('T')[0],
              autoComplete: 'bday'
            }
          },
          {
            id: 'gender',
            name: 'personalDetails.gender',
            type: 'select',
            label: 'Gender',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Gender is required'
              }
            ],
            options: [
              { value: '', label: 'Select Gender', disabled: true },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]
          },
          {
            id: 'mobileNumber',
            name: 'personalDetails.mobileNumber',
            type: 'tel',
            label: 'Mobile Number',
            placeholder: 'Enter 10-digit mobile number',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Mobile number is required'
              },
              {
                type: 'pattern',
                value: '^[6-9]\\d{9}$',
                message: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9'
              }
            ],
            attributes: {
              maxLength: 10,
              inputMode: 'tel',
              autoComplete: 'tel'
            }
          },
          {
            id: 'email',
            name: 'personalDetails.email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'Enter email address',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Email is required'
              },
              {
                type: 'pattern',
                value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                message: 'Please provide a valid email address'
              }
            ],
            attributes: {
              autoComplete: 'email'
            }
          },
          {
            id: 'street',
            name: 'personalDetails.address.street',
            type: 'text',
            label: 'Street Address',
            placeholder: 'Enter street address',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'Street address is required'
              },
              {
                type: 'min',
                value: 5,
                message: 'Street address must be at least 5 characters'
              },
              {
                type: 'max',
                value: 100,
                message: 'Street address cannot exceed 100 characters'
              }
            ],
            attributes: {
              maxLength: 100,
              autoComplete: 'street-address'
            }
          },
          {
            id: 'pincode',
            name: 'personalDetails.address.pincode',
            type: 'text',
            label: 'PIN Code',
            placeholder: 'Enter 6-digit PIN code',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'PIN code is required'
              },
              {
                type: 'pattern',
                value: '^\\d{6}$',
                message: 'PIN code must be exactly 6 digits'
              }
            ],
            attributes: {
              maxLength: 6,
              inputMode: 'numeric',
              autoComplete: 'postal-code'
            }
          },
          {
            id: 'city',
            name: 'personalDetails.address.city',
            type: 'text',
            label: 'City',
            placeholder: 'City (auto-filled from PIN code)',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'City is required'
              },
              {
                type: 'min',
                value: 2,
                message: 'City must be at least 2 characters'
              },
              {
                type: 'max',
                value: 50,
                message: 'City cannot exceed 50 characters'
              },
              {
                type: 'pattern',
                value: '^[A-Za-z\\s]+$',
                message: 'City can only contain letters and spaces'
              }
            ],
            attributes: {
              maxLength: 50,
              autoComplete: 'address-level2'
            }
          },
          {
            id: 'state',
            name: 'personalDetails.address.state',
            type: 'text',
            label: 'State',
            placeholder: 'State (auto-filled from PIN code)',
            required: true,
            validationRules: [
              {
                type: 'required',
                value: true,
                message: 'State is required'
              },
              {
                type: 'min',
                value: 2,
                message: 'State must be at least 2 characters'
              },
              {
                type: 'max',
                value: 50,
                message: 'State cannot exceed 50 characters'
              },
              {
                type: 'pattern',
                value: '^[A-Za-z\\s]+$',
                message: 'State can only contain letters and spaces'
              }
            ],
            attributes: {
              maxLength: 50,
              autoComplete: 'address-level1'
            }
          }
        ]
      }
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'default',
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  /**
   * Get the latest active form schema
   * @returns {Promise<FormSchema>}
   */
  static async getFormSchema() {
    try {
      // Try to get the latest active schema from database
      const latestSchema = await prisma.formSchema.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (latestSchema && latestSchema.schemaData) {
        logger.info('Retrieved form schema from database', {
          version: latestSchema.version,
          schemaId: latestSchema.id
        });
        
        return {
          ...latestSchema.schemaData,
          metadata: {
            ...latestSchema.schemaData.metadata,
            source: 'database',
            schemaId: latestSchema.id,
            version: latestSchema.version
          }
        };
      }

      // Fallback to default schema
      logger.info('Using default form schema (no database schema found)');
      return this.DEFAULT_SCHEMA;

    } catch (error) {
      logger.error('Failed to retrieve form schema from database', {
        error: error.message
      });
      
      // Return default schema on database error
      return this.DEFAULT_SCHEMA;
    }
  }

  /**
   * Save a new form schema to database
   * @param {FormSchema} schema - Form schema to save
   * @param {string} version - Schema version
   * @returns {Promise<Object>}
   */
  static async saveFormSchema(schema, version) {
    try {
      // Deactivate existing schemas
      await prisma.formSchema.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Create new active schema
      const newSchema = await prisma.formSchema.create({
        data: {
          version,
          schemaData: schema,
          isActive: true
        }
      });

      logger.info('Saved new form schema to database', {
        version,
        schemaId: newSchema.id
      });

      return {
        success: true,
        schemaId: newSchema.id,
        version: newSchema.version,
        message: 'Form schema saved successfully'
      };

    } catch (error) {
      logger.error('Failed to save form schema to database', {
        error: error.message,
        version
      });
      
      throw new DatabaseError('Failed to save form schema');
    }
  }

  /**
   * Get form schema for a specific step
   * @param {number} stepNumber - Step number (1 or 2)
   * @returns {Promise<FormStep>}
   */
  static async getStepSchema(stepNumber) {
    if (stepNumber < 1 || stepNumber > 2) {
      throw new ValidationError('Step number must be 1 or 2');
    }

    const fullSchema = await this.getFormSchema();
    const step = fullSchema.steps.find(s => s.stepNumber === stepNumber);

    if (!step) {
      throw new AppError(`Step ${stepNumber} not found in form schema`, 404);
    }

    return step;
  }

  /**
   * Get validation rules for a specific field
   * @param {string} fieldName - Field name
   * @returns {Promise<ValidationRule[]>}
   */
  static async getFieldValidationRules(fieldName) {
    const fullSchema = await this.getFormSchema();
    
    for (const step of fullSchema.steps) {
      const field = step.fields.find(f => f.name === fieldName || f.id === fieldName);
      if (field) {
        return field.validationRules;
      }
    }

    throw new ValidationError(`Field '${fieldName}' not found in form schema`);
  }

  /**
   * Validate form data against schema
   * @param {Object} formData - Form data to validate
   * @param {number} stepNumber - Step number
   * @returns {Promise<Object>}
   */
  static async validateFormData(formData, stepNumber) {
    const step = await this.getStepSchema(stepNumber);
    const errors = [];
    const validatedData = {};

    for (const field of step.fields) {
      const fieldValue = this.getNestedValue(formData, field.name);
      const fieldErrors = [];

      // Apply validation rules
      for (const rule of field.validationRules) {
        const validationResult = this.applyValidationRule(fieldValue, rule, field);
        if (!validationResult.isValid) {
          fieldErrors.push(validationResult.message);
        }
      }

      if (fieldErrors.length > 0) {
        errors.push({
          field: field.name,
          errors: fieldErrors
        });
      } else {
        this.setNestedValue(validatedData, field.name, fieldValue);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: errors.length === 0 ? validatedData : null
    };
  }

  /**
   * Apply a single validation rule
   * @param {any} value - Field value
   * @param {ValidationRule} rule - Validation rule
   * @param {FormField} field - Field definition
   * @returns {Object}
   */
  static applyValidationRule(value, rule, field) {
    switch (rule.type) {
      case 'required':
        return {
          isValid: value !== null && value !== undefined && value !== '',
          message: rule.message
        };

      case 'pattern':
        const regex = new RegExp(rule.value);
        return {
          isValid: !value || regex.test(value),
          message: rule.message
        };

      case 'min':
        return {
          isValid: !value || value.length >= rule.value,
          message: rule.message
        };

      case 'max':
        return {
          isValid: !value || value.length <= rule.value,
          message: rule.message
        };

      case 'length':
        return {
          isValid: !value || value.length === rule.value,
          message: rule.message
        };

      default:
        return { isValid: true, message: '' };
    }
  }

  /**
   * Get nested object value by dot notation path
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any}
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested object value by dot notation path
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot notation path
   * @param {any} value - Value to set
   */
  static setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Get schema metadata
   * @returns {Promise<Object>}
   */
  static async getSchemaMetadata() {
    const schema = await this.getFormSchema();
    return {
      version: schema.version,
      title: schema.title,
      description: schema.description,
      totalSteps: schema.steps.length,
      totalFields: schema.steps.reduce((total, step) => total + step.fields.length, 0),
      metadata: schema.metadata
    };
  }
}

module.exports = FormSchemaService;
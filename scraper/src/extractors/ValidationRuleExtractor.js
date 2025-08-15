/**
 * @fileoverview Validation rule extractor for form fields
 */

const logger = require('../utils/logger');

/**
 * @typedef {Object} ValidationRule
 * @property {'pattern'|'length'|'required'|'custom'} type
 * @property {string|number|boolean} value
 * @property {string} message
 */

class ValidationRuleExtractor {
  constructor() {
    this.commonPatterns = {
      aadhaar: {
        pattern: '^[0-9]{12}$',
        message: 'Aadhaar number must be 12 digits'
      },
      pan: {
        pattern: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
        message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
      },
      otp: {
        pattern: '^[0-9]{6}$',
        message: 'OTP must be 6 digits'
      },
      mobile: {
        pattern: '^[6-9][0-9]{9}$',
        message: 'Mobile number must be 10 digits starting with 6-9'
      },
      email: {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        message: 'Please enter a valid email address'
      },
      pincode: {
        pattern: '^[0-9]{6}$',
        message: 'PIN code must be 6 digits'
      }
    };
  }

  /**
   * Extract validation rules for a form field
   * @param {Object} page - Puppeteer page instance
   * @param {Object} field - Form field object
   * @returns {Promise<ValidationRule[]>}
   */
  async extractValidationRules(page, field) {
    try {
      const rules = [];

      // Add basic required validation
      if (field.required) {
        rules.push({
          type: 'required',
          value: true,
          message: `${field.label || field.name} is required`
        });
      }

      // Extract client-side validation from page
      const clientValidation = await this.extractClientSideValidation(page, field);
      rules.push(...clientValidation);

      // Add pattern-based validation
      const patternValidation = this.getPatternValidation(field);
      if (patternValidation) {
        rules.push(patternValidation);
      }

      // Add length validation
      const lengthValidation = await this.extractLengthValidation(page, field);
      if (lengthValidation) {
        rules.push(lengthValidation);
      }

      // Remove duplicates
      return this.removeDuplicateRules(rules);

    } catch (error) {
      logger.warn(`Failed to extract validation rules for field ${field.id}:`, error.message);
      return this.getFallbackValidationRules(field);
    }
  }

  /**
   * Extract client-side validation from JavaScript
   * @param {Object} page - Puppeteer page instance
   * @param {Object} field - Form field object
   * @returns {Promise<ValidationRule[]>}
   */
  async extractClientSideValidation(page, field) {
    try {
      const validation = await page.evaluate((fieldId, fieldName) => {
        const rules = [];
        
        // Look for validation in common JavaScript validation libraries
        const element = document.getElementById(fieldId) || 
                       document.querySelector(`[name="${fieldName}"]`);
        
        if (!element) return rules;

        // Check for HTML5 validation attributes
        if (element.pattern) {
          rules.push({
            type: 'pattern',
            value: element.pattern,
            message: element.title || 'Invalid format'
          });
        }

        if (element.minLength) {
          rules.push({
            type: 'length',
            value: { min: element.minLength },
            message: `Minimum length is ${element.minLength}`
          });
        }

        if (element.maxLength) {
          rules.push({
            type: 'length',
            value: { max: element.maxLength },
            message: `Maximum length is ${element.maxLength}`
          });
        }

        // Look for validation in script tags
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const scriptContent = script.textContent || script.innerHTML;
          
          // Look for validation patterns in JavaScript
          if (scriptContent.includes(fieldId) || scriptContent.includes(fieldName)) {
            // Extract regex patterns
            const regexMatches = scriptContent.match(/\/\^[^\/]+\$\/[gim]*/g);
            if (regexMatches) {
              regexMatches.forEach(regex => {
                rules.push({
                  type: 'pattern',
                  value: regex.slice(1, -1), // Remove / delimiters
                  message: 'Invalid format'
                });
              });
            }
          }
        }

        return rules;
      }, field.id, field.name);

      return validation || [];

    } catch (error) {
      logger.warn(`Failed to extract client-side validation for ${field.id}:`, error.message);
      return [];
    }
  }

  /**
   * Get pattern validation based on field characteristics
   * @param {Object} field - Form field object
   * @returns {ValidationRule|null}
   */
  getPatternValidation(field) {
    const fieldText = `${field.id} ${field.name} ${field.label}`.toLowerCase();

    // Check for known patterns
    for (const [patternName, patternData] of Object.entries(this.commonPatterns)) {
      if (fieldText.includes(patternName) || 
          (patternName === 'aadhaar' && fieldText.includes('aadhar'))) {
        return {
          type: 'pattern',
          value: patternData.pattern,
          message: patternData.message
        };
      }
    }

    // Special cases based on field type
    if (field.type === 'email') {
      return {
        type: 'pattern',
        value: this.commonPatterns.email.pattern,
        message: this.commonPatterns.email.message
      };
    }

    return null;
  }

  /**
   * Extract length validation from element attributes
   * @param {Object} page - Puppeteer page instance
   * @param {Object} field - Form field object
   * @returns {Promise<ValidationRule|null>}
   */
  async extractLengthValidation(page, field) {
    try {
      const lengthInfo = await page.evaluate((fieldId, fieldName) => {
        const element = document.getElementById(fieldId) || 
                       document.querySelector(`[name="${fieldName}"]`);
        
        if (!element) return null;

        const info = {};
        
        if (element.minLength && element.minLength > 0) {
          info.min = element.minLength;
        }
        
        if (element.maxLength && element.maxLength > 0) {
          info.max = element.maxLength;
        }

        // Check for size attribute on input elements
        if (element.size && element.size > 0) {
          info.size = element.size;
        }

        return Object.keys(info).length > 0 ? info : null;
      }, field.id, field.name);

      if (lengthInfo) {
        const rule = {
          type: 'length',
          value: lengthInfo,
          message: this.generateLengthMessage(lengthInfo)
        };
        return rule;
      }

      return null;

    } catch (error) {
      logger.warn(`Failed to extract length validation for ${field.id}:`, error.message);
      return null;
    }
  }

  /**
   * Generate appropriate length validation message
   * @param {Object} lengthInfo - Length constraints
   * @returns {string}
   */
  generateLengthMessage(lengthInfo) {
    if (lengthInfo.min && lengthInfo.max) {
      if (lengthInfo.min === lengthInfo.max) {
        return `Must be exactly ${lengthInfo.min} characters`;
      }
      return `Must be between ${lengthInfo.min} and ${lengthInfo.max} characters`;
    }
    
    if (lengthInfo.min) {
      return `Must be at least ${lengthInfo.min} characters`;
    }
    
    if (lengthInfo.max) {
      return `Must be no more than ${lengthInfo.max} characters`;
    }
    
    return 'Invalid length';
  }

  /**
   * Remove duplicate validation rules
   * @param {ValidationRule[]} rules - Rules to deduplicate
   * @returns {ValidationRule[]}
   */
  removeDuplicateRules(rules) {
    const seen = new Set();
    const uniqueRules = [];

    for (const rule of rules) {
      const key = `${rule.type}_${JSON.stringify(rule.value)}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRules.push(rule);
      }
    }

    return uniqueRules;
  }

  /**
   * Get fallback validation rules when extraction fails
   * @param {Object} field - Form field object
   * @returns {ValidationRule[]}
   */
  getFallbackValidationRules(field) {
    const rules = [];
    const fieldText = `${field.id} ${field.name} ${field.label}`.toLowerCase();

    // Add required rule if field is required
    if (field.required) {
      rules.push({
        type: 'required',
        value: true,
        message: `${field.label || field.name} is required`
      });
    }

    // Add pattern validation based on field characteristics
    if (fieldText.includes('aadhaar') || fieldText.includes('aadhar')) {
      rules.push({
        type: 'pattern',
        value: this.commonPatterns.aadhaar.pattern,
        message: this.commonPatterns.aadhaar.message
      });
    } else if (fieldText.includes('pan')) {
      rules.push({
        type: 'pattern',
        value: this.commonPatterns.pan.pattern,
        message: this.commonPatterns.pan.message
      });
    } else if (fieldText.includes('otp')) {
      rules.push({
        type: 'pattern',
        value: this.commonPatterns.otp.pattern,
        message: this.commonPatterns.otp.message
      });
    } else if (fieldText.includes('mobile') || fieldText.includes('phone')) {
      rules.push({
        type: 'pattern',
        value: this.commonPatterns.mobile.pattern,
        message: this.commonPatterns.mobile.message
      });
    }

    return rules;
  }
}

module.exports = ValidationRuleExtractor;
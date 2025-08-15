/**
 * @fileoverview Main scraper for Udyam registration portal
 * Extracts form fields and validation rules from the first two steps
 */

const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./utils/logger');
const FormFieldExtractor = require('./extractors/FormFieldExtractor');
const ValidationRuleExtractor = require('./extractors/ValidationRuleExtractor');
const SchemaGenerator = require('./generators/SchemaGenerator');

/**
 * @typedef {Object} ScrapedFormField
 * @property {string} id
 * @property {string} name
 * @property {'text'|'select'|'radio'|'checkbox'|'button'} type
 * @property {string} label
 * @property {string} [placeholder]
 * @property {boolean} required
 * @property {ValidationRule[]} validationRules
 * @property {SelectOption[]} [options]
 */

/**
 * @typedef {Object} ValidationRule
 * @property {'pattern'|'length'|'required'|'custom'} type
 * @property {string|number} value
 * @property {string} message
 */

/**
 * @typedef {Object} SelectOption
 * @property {string} value
 * @property {string} text
 */

/**
 * @typedef {Object} FormSchema
 * @property {string} version
 * @property {Date} scrapedAt
 * @property {Object} steps
 * @property {ScrapedFormField[]} steps.step1
 * @property {ScrapedFormField[]} steps.step2
 */

class UdyamScraper {
  constructor(options = {}) {
    this.baseUrl = 'https://udyamregistration.gov.in/UdyamRegistration.aspx';
    this.outputDir = options.outputDir || path.join(__dirname, '../output');
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.headless = options.headless !== false;
    
    this.browser = null;
    this.page = null;
    
    this.fieldExtractor = new FormFieldExtractor();
    this.validationExtractor = new ValidationRuleExtractor();
    this.schemaGenerator = new SchemaGenerator();
  }

  /**
   * Initialize the scraper
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      logger.info('Initializing Udyam scraper...');
      
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Set viewport and user agent
      await this.page.setViewport({ width: 1366, height: 768 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      logger.info('Scraper initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scraper:', error);
      throw error;
    }
  }

  /**
   * Navigate to Udyam portal with retry logic
   * @returns {Promise<void>}
   */
  async navigateToPortal() {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.info(`Navigating to Udyam portal (attempt ${attempt}/${this.retryAttempts})`);
        
        await this.page.goto(this.baseUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        // Wait for the main form to load
        await this.page.waitForSelector('form', { timeout: 10000 });
        
        logger.info('Successfully navigated to Udyam portal');
        return;
        
      } catch (error) {
        logger.warn(`Navigation attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retryAttempts) {
          throw new Error(`Failed to navigate to portal after ${this.retryAttempts} attempts: ${error.message}`);
        }
        
        await this.delay(this.retryDelay);
      }
    }
  }

  /**
   * Scrape form structure from both steps
   * @returns {Promise<FormSchema>}
   */
  async scrapeFormStructure() {
    try {
      logger.info('Starting form structure scraping...');
      
      await this.navigateToPortal();
      
      // Extract Step 1 fields
      logger.info('Extracting Step 1 form fields...');
      const step1Fields = await this.extractStep1Fields();
      
      // Extract Step 2 fields (if accessible)
      logger.info('Extracting Step 2 form fields...');
      const step2Fields = await this.extractStep2Fields();
      
      // Generate complete schema
      const schema = this.schemaGenerator.generateSchema({
        step1: step1Fields,
        step2: step2Fields
      });
      
      logger.info('Form structure scraping completed successfully');
      return schema;
      
    } catch (error) {
      logger.error('Failed to scrape form structure:', error);
      throw error;
    }
  }

  /**
   * Extract form fields from Step 1 (Aadhaar verification)
   * @returns {Promise<ScrapedFormField[]>}
   */
  async extractStep1Fields() {
    try {
      // Wait for step 1 elements to be visible
      await this.page.waitForSelector('input, select, button', { timeout: 10000 });
      
      // Extract all form elements
      const formElements = await this.page.evaluate(() => {
        const elements = [];
        const inputs = document.querySelectorAll('input, select, button, textarea');
        
        inputs.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          
          // Skip hidden elements
          if (rect.width === 0 || rect.height === 0 || 
              window.getComputedStyle(element).display === 'none') {
            return;
          }
          
          const elementData = {
            id: element.id || `element_${index}`,
            name: element.name || element.id || `element_${index}`,
            type: element.type || element.tagName.toLowerCase(),
            tagName: element.tagName.toLowerCase(),
            className: element.className,
            placeholder: element.placeholder || '',
            required: element.required || element.hasAttribute('required'),
            disabled: element.disabled,
            value: element.value || '',
            innerHTML: element.innerHTML,
            outerHTML: element.outerHTML
          };
          
          // Find associated label
          let label = '';
          if (element.id) {
            const labelElement = document.querySelector(`label[for="${element.id}"]`);
            if (labelElement) {
              label = labelElement.textContent.trim();
            }
          }
          
          // If no label found, look for nearby text
          if (!label) {
            const parent = element.parentElement;
            if (parent) {
              const textNodes = Array.from(parent.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 0);
              
              if (textNodes.length > 0) {
                label = textNodes[0];
              }
            }
          }
          
          elementData.label = label;
          
          // Extract options for select elements
          if (element.tagName.toLowerCase() === 'select') {
            elementData.options = Array.from(element.options).map(option => ({
              value: option.value,
              text: option.textContent.trim()
            }));
          }
          
          elements.push(elementData);
        });
        
        return elements;
      });
      
      // Process and clean the extracted elements
      const processedFields = await this.fieldExtractor.processFormElements(formElements, 'step1');
      
      // Extract validation rules for each field
      for (const field of processedFields) {
        field.validationRules = await this.validationExtractor.extractValidationRules(this.page, field);
      }
      
      logger.info(`Extracted ${processedFields.length} fields from Step 1`);
      return processedFields;
      
    } catch (error) {
      logger.error('Failed to extract Step 1 fields:', error);
      throw error;
    }
  }

  /**
   * Extract form fields from Step 2 (PAN verification)
   * @returns {Promise<ScrapedFormField[]>}
   */
  async extractStep2Fields() {
    try {
      // Try to navigate to step 2 or find step 2 elements
      // This might require filling step 1 first or finding step 2 in the same page
      
      // Look for step 2 elements that might be hidden initially
      const step2Elements = await this.page.evaluate(() => {
        const elements = [];
        
        // Look for elements that might be related to step 2
        const allElements = document.querySelectorAll('input, select, button, textarea');
        
        allElements.forEach((element, index) => {
          const elementText = element.outerHTML.toLowerCase();
          const parentText = element.parentElement ? element.parentElement.outerHTML.toLowerCase() : '';
          
          // Check if element might be related to PAN or step 2
          const isPanRelated = elementText.includes('pan') || 
                              parentText.includes('pan') ||
                              elementText.includes('step') ||
                              elementText.includes('personal');
          
          if (isPanRelated) {
            const elementData = {
              id: element.id || `step2_element_${index}`,
              name: element.name || element.id || `step2_element_${index}`,
              type: element.type || element.tagName.toLowerCase(),
              tagName: element.tagName.toLowerCase(),
              className: element.className,
              placeholder: element.placeholder || '',
              required: element.required || element.hasAttribute('required'),
              disabled: element.disabled,
              value: element.value || '',
              innerHTML: element.innerHTML,
              outerHTML: element.outerHTML
            };
            
            // Find label
            let label = '';
            if (element.id) {
              const labelElement = document.querySelector(`label[for="${element.id}"]`);
              if (labelElement) {
                label = labelElement.textContent.trim();
              }
            }
            
            elementData.label = label;
            
            if (element.tagName.toLowerCase() === 'select') {
              elementData.options = Array.from(element.options).map(option => ({
                value: option.value,
                text: option.textContent.trim()
              }));
            }
            
            elements.push(elementData);
          }
        });
        
        return elements;
      });
      
      // Process step 2 elements
      const processedFields = await this.fieldExtractor.processFormElements(step2Elements, 'step2');
      
      // Extract validation rules
      for (const field of processedFields) {
        field.validationRules = await this.validationExtractor.extractValidationRules(this.page, field);
      }
      
      logger.info(`Extracted ${processedFields.length} fields from Step 2`);
      return processedFields;
      
    } catch (error) {
      logger.warn('Failed to extract Step 2 fields, using fallback data:', error.message);
      
      // Return fallback Step 2 fields based on requirements
      return this.getFallbackStep2Fields();
    }
  }

  /**
   * Get fallback Step 2 fields based on requirements
   * @returns {ScrapedFormField[]}
   */
  getFallbackStep2Fields() {
    return [
      {
        id: 'pan_number',
        name: 'panNumber',
        type: 'text',
        label: 'PAN Number',
        placeholder: 'Enter PAN Number',
        required: true,
        validationRules: [
          {
            type: 'pattern',
            value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
            message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
          },
          {
            type: 'required',
            value: true,
            message: 'PAN Number is required'
          }
        ]
      },
      {
        id: 'applicant_name',
        name: 'applicantName',
        type: 'text',
        label: 'Applicant Name',
        placeholder: 'Enter Full Name',
        required: true,
        validationRules: [
          {
            type: 'required',
            value: true,
            message: 'Applicant Name is required'
          }
        ]
      }
    ];
  }

  /**
   * Save scraped data to files
   * @param {FormSchema} schema - The scraped form schema
   * @returns {Promise<void>}
   */
  async saveScrapedData(schema) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save complete schema
      const schemaPath = path.join(this.outputDir, `udyam-schema-${timestamp}.json`);
      await fs.writeJson(schemaPath, schema, { spaces: 2 });
      
      // Save latest schema (overwrite)
      const latestSchemaPath = path.join(this.outputDir, 'udyam-schema-latest.json');
      await fs.writeJson(latestSchemaPath, schema, { spaces: 2 });
      
      logger.info(`Schema saved to: ${schemaPath}`);
      logger.info(`Latest schema saved to: ${latestSchemaPath}`);
      
    } catch (error) {
      logger.error('Failed to save scraped data:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      logger.info('Scraper cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run the complete scraping process
   * @returns {Promise<FormSchema>}
   */
  async run() {
    try {
      await this.initialize();
      const schema = await this.scrapeFormStructure();
      await this.saveScrapedData(schema);
      return schema;
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = UdyamScraper;
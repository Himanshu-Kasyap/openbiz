/**
 * @fileoverview Unit tests for UdyamScraper
 */

const UdyamScraper = require('../src/scraper');
const FormFieldExtractor = require('../src/extractors/FormFieldExtractor');
const ValidationRuleExtractor = require('../src/extractors/ValidationRuleExtractor');
const SchemaGenerator = require('../src/generators/SchemaGenerator');
const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('puppeteer');
jest.mock('fs-extra');
jest.mock('../src/utils/logger');

const mockPuppeteer = require('puppeteer');
const mockFs = require('fs-extra');

describe('UdyamScraper', () => {
  let scraper;
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock browser and page
    mockPage = {
      setViewport: jest.fn(),
      setUserAgent: jest.fn(),
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn()
    };
    
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn()
    };
    
    mockPuppeteer.launch.mockResolvedValue(mockBrowser);
    mockFs.ensureDir.mockResolvedValue();
    mockFs.writeJson.mockResolvedValue();
    
    scraper = new UdyamScraper({
      outputDir: '/test/output',
      retryAttempts: 2,
      retryDelay: 100
    });
  });

  afterEach(async () => {
    if (scraper) {
      await scraper.cleanup();
    }
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultScraper = new UdyamScraper();
      
      expect(defaultScraper.baseUrl).toBe('https://udyamregistration.gov.in/UdyamRegistration.aspx');
      expect(defaultScraper.retryAttempts).toBe(3);
      expect(defaultScraper.retryDelay).toBe(2000);
      expect(defaultScraper.headless).toBe(true);
    });

    it('should initialize with custom options', () => {
      const customScraper = new UdyamScraper({
        outputDir: '/custom/output',
        retryAttempts: 5,
        retryDelay: 1000,
        headless: false
      });
      
      expect(customScraper.outputDir).toBe('/custom/output');
      expect(customScraper.retryAttempts).toBe(5);
      expect(customScraper.retryDelay).toBe(1000);
      expect(customScraper.headless).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize browser and page successfully', async () => {
      await scraper.initialize();
      
      expect(mockFs.ensureDir).toHaveBeenCalledWith('/test/output');
      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ])
      });
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1366, height: 768 });
      expect(mockPage.setUserAgent).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockPuppeteer.launch.mockRejectedValue(new Error('Browser launch failed'));
      
      await expect(scraper.initialize()).rejects.toThrow('Browser launch failed');
    });
  });

  describe('navigateToPortal', () => {
    beforeEach(async () => {
      await scraper.initialize();
    });

    it('should navigate to portal successfully', async () => {
      mockPage.goto.mockResolvedValue();
      mockPage.waitForSelector.mockResolvedValue();
      
      await scraper.navigateToPortal();
      
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://udyamregistration.gov.in/UdyamRegistration.aspx',
        {
          waitUntil: 'networkidle2',
          timeout: 30000
        }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('form', { timeout: 10000 });
    });

    it('should retry on navigation failure', async () => {
      mockPage.goto
        .mockRejectedValueOnce(new Error('Navigation failed'))
        .mockResolvedValue();
      mockPage.waitForSelector.mockResolvedValue();
      
      await scraper.navigateToPortal();
      
      expect(mockPage.goto).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retry attempts', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));
      
      await expect(scraper.navigateToPortal()).rejects.toThrow(
        'Failed to navigate to portal after 2 attempts'
      );
      expect(mockPage.goto).toHaveBeenCalledTimes(2);
    });
  });

  describe('extractStep1Fields', () => {
    beforeEach(async () => {
      await scraper.initialize();
    });

    it('should extract Step 1 fields successfully', async () => {
      const mockElements = [
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
          id: 'otp_input',
          name: 'otp',
          type: 'text',
          tagName: 'input',
          label: 'OTP',
          required: true,
          placeholder: 'Enter OTP'
        }
      ];

      mockPage.waitForSelector.mockResolvedValue();
      mockPage.evaluate.mockResolvedValue(mockElements);
      
      // Mock the field extractor
      scraper.fieldExtractor.processFormElements = jest.fn().mockResolvedValue([
        {
          id: 'aadhaar_input',
          name: 'aadhaarNumber',
          type: 'text',
          label: 'Aadhaar Number',
          required: true,
          validationRules: []
        }
      ]);
      
      scraper.validationExtractor.extractValidationRules = jest.fn().mockResolvedValue([
        {
          type: 'pattern',
          value: '^[0-9]{12}$',
          message: 'Aadhaar number must be 12 digits'
        }
      ]);

      const result = await scraper.extractStep1Fields();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('aadhaar_input');
      expect(result[0].validationRules).toHaveLength(1);
    });

    it('should handle extraction errors', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));
      
      await expect(scraper.extractStep1Fields()).rejects.toThrow('Selector not found');
    });
  });

  describe('extractStep2Fields', () => {
    beforeEach(async () => {
      await scraper.initialize();
    });

    it('should extract Step 2 fields successfully', async () => {
      const mockElements = [
        {
          id: 'pan_input',
          name: 'panNumber',
          type: 'text',
          tagName: 'input',
          label: 'PAN Number',
          required: true
        }
      ];

      mockPage.evaluate.mockResolvedValue(mockElements);
      
      scraper.fieldExtractor.processFormElements = jest.fn().mockResolvedValue([
        {
          id: 'pan_input',
          name: 'panNumber',
          type: 'text',
          label: 'PAN Number',
          required: true,
          validationRules: []
        }
      ]);
      
      scraper.validationExtractor.extractValidationRules = jest.fn().mockResolvedValue([
        {
          type: 'pattern',
          value: '[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}',
          message: 'PAN must be in format: 5 letters, 4 digits, 1 letter'
        }
      ]);

      const result = await scraper.extractStep2Fields();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pan_input');
    });

    it('should return fallback fields on extraction failure', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Evaluation failed'));
      
      const result = await scraper.extractStep2Fields();
      
      expect(result).toHaveLength(2); // Fallback fields
      expect(result[0].id).toBe('pan_number');
      expect(result[1].id).toBe('applicant_name');
    });
  });

  describe('scrapeFormStructure', () => {
    beforeEach(async () => {
      await scraper.initialize();
    });

    it('should scrape complete form structure', async () => {
      // Mock navigation
      mockPage.goto.mockResolvedValue();
      mockPage.waitForSelector.mockResolvedValue();
      
      // Mock field extraction
      scraper.extractStep1Fields = jest.fn().mockResolvedValue([
        { id: 'aadhaar', name: 'aadhaar', type: 'text', label: 'Aadhaar' }
      ]);
      
      scraper.extractStep2Fields = jest.fn().mockResolvedValue([
        { id: 'pan', name: 'pan', type: 'text', label: 'PAN' }
      ]);
      
      // Mock schema generation
      const mockSchema = {
        version: '1.0.0',
        steps: {
          step1: [{ id: 'aadhaar' }],
          step2: [{ id: 'pan' }]
        }
      };
      
      scraper.schemaGenerator.generateSchema = jest.fn().mockReturnValue(mockSchema);
      
      const result = await scraper.scrapeFormStructure();
      
      expect(scraper.extractStep1Fields).toHaveBeenCalled();
      expect(scraper.extractStep2Fields).toHaveBeenCalled();
      expect(scraper.schemaGenerator.generateSchema).toHaveBeenCalled();
      expect(result).toEqual(mockSchema);
    });
  });

  describe('saveScrapedData', () => {
    it('should save schema to files', async () => {
      const mockSchema = {
        version: '1.0.0',
        scrapedAt: '2024-01-01T00:00:00.000Z',
        steps: { step1: [], step2: [] }
      };
      
      await scraper.saveScrapedData(mockSchema);
      
      expect(mockFs.writeJson).toHaveBeenCalledTimes(2);
      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('udyam-schema-latest.json'),
        mockSchema,
        { spaces: 2 }
      );
    });

    it('should handle save errors', async () => {
      mockFs.writeJson.mockRejectedValue(new Error('Write failed'));
      
      const mockSchema = { version: '1.0.0' };
      
      await expect(scraper.saveScrapedData(mockSchema)).rejects.toThrow('Write failed');
    });
  });

  describe('cleanup', () => {
    it('should cleanup browser resources', async () => {
      await scraper.initialize();
      
      await scraper.cleanup();
      
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      await scraper.initialize();
      mockPage.close.mockRejectedValue(new Error('Close failed'));
      
      // Should not throw
      await expect(scraper.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('run', () => {
    it('should run complete scraping process', async () => {
      const mockSchema = {
        version: '1.0.0',
        steps: { step1: [], step2: [] }
      };
      
      scraper.initialize = jest.fn().mockResolvedValue();
      scraper.scrapeFormStructure = jest.fn().mockResolvedValue(mockSchema);
      scraper.saveScrapedData = jest.fn().mockResolvedValue();
      scraper.cleanup = jest.fn().mockResolvedValue();
      
      const result = await scraper.run();
      
      expect(scraper.initialize).toHaveBeenCalled();
      expect(scraper.scrapeFormStructure).toHaveBeenCalled();
      expect(scraper.saveScrapedData).toHaveBeenCalledWith(mockSchema);
      expect(scraper.cleanup).toHaveBeenCalled();
      expect(result).toEqual(mockSchema);
    });

    it('should cleanup even if scraping fails', async () => {
      scraper.initialize = jest.fn().mockResolvedValue();
      scraper.scrapeFormStructure = jest.fn().mockRejectedValue(new Error('Scraping failed'));
      scraper.cleanup = jest.fn().mockResolvedValue();
      
      await expect(scraper.run()).rejects.toThrow('Scraping failed');
      expect(scraper.cleanup).toHaveBeenCalled();
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await scraper.delay(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });
});
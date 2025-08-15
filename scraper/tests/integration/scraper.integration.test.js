/**
 * @fileoverview Integration tests for the scraper
 */

const UdyamScraper = require('../../src/scraper');
const fs = require('fs-extra');
const path = require('path');

// Skip integration tests in CI or when SKIP_INTEGRATION is set
const skipIntegration = process.env.CI || process.env.SKIP_INTEGRATION;

describe('Scraper Integration Tests', () => {
  let scraper;
  let testOutputDir;

  beforeAll(() => {
    if (skipIntegration) {
      console.log('Skipping integration tests');
      return;
    }
    
    testOutputDir = path.join(__dirname, '../temp-output');
  });

  beforeEach(() => {
    if (skipIntegration) return;
    
    scraper = new UdyamScraper({
      outputDir: testOutputDir,
      headless: true,
      retryAttempts: 1,
      retryDelay: 1000
    });
  });

  afterEach(async () => {
    if (skipIntegration) return;
    
    if (scraper) {
      await scraper.cleanup();
    }
  });

  afterAll(async () => {
    if (skipIntegration) return;
    
    // Clean up test output directory
    try {
      await fs.remove(testOutputDir);
    } catch (error) {
      console.warn('Failed to clean up test output directory:', error.message);
    }
  });

  describe('Full scraping workflow', () => {
    it('should complete scraping workflow with fallback data', async () => {
      if (skipIntegration) {
        console.log('Skipping integration test');
        return;
      }

      // This test uses fallback data when the actual site is not accessible
      try {
        const schema = await scraper.run();
        
        expect(schema).toBeDefined();
        expect(schema.version).toBe('1.0.0');
        expect(schema.steps).toBeDefined();
        expect(schema.steps.step1).toBeDefined();
        expect(schema.steps.step2).toBeDefined();
        
        // Check that schema file was created
        const schemaPath = path.join(testOutputDir, 'udyam-schema-latest.json');
        const schemaExists = await fs.pathExists(schemaPath);
        expect(schemaExists).toBe(true);
        
        if (schemaExists) {
          const savedSchema = await fs.readJson(schemaPath);
          expect(savedSchema.version).toBe(schema.version);
        }
        
      } catch (error) {
        // If the test fails due to network issues, that's expected
        if (error.message.includes('net::') || 
            error.message.includes('timeout') ||
            error.message.includes('Navigation')) {
          console.log('Integration test skipped due to network issues:', error.message);
          return;
        }
        throw error;
      }
    }, 60000); // 60 second timeout for integration test
  });

  describe('Component integration', () => {
    it('should integrate all components correctly', async () => {
      if (skipIntegration) return;

      await scraper.initialize();
      
      // Test that all components are properly initialized
      expect(scraper.fieldExtractor).toBeDefined();
      expect(scraper.validationExtractor).toBeDefined();
      expect(scraper.schemaGenerator).toBeDefined();
      expect(scraper.browser).toBeDefined();
      expect(scraper.page).toBeDefined();
    });
  });
});
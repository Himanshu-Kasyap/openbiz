#!/usr/bin/env node

/**
 * @fileoverview CLI script for running the Udyam scraper
 */

const UdyamScraper = require('./scraper');
const logger = require('./utils/logger');
const fs = require('fs-extra');
const path = require('path');

/**
 * Parse command line arguments
 * @returns {Object}
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    headless: true,
    outputDir: path.join(__dirname, '../output'),
    retryAttempts: 3,
    retryDelay: 2000
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--no-headless':
        options.headless = false;
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--retry-attempts':
        options.retryAttempts = parseInt(args[++i], 10);
        break;
      case '--retry-delay':
        options.retryDelay = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          logger.warn(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Udyam Registration Portal Scraper

Usage: node cli.js [options]

Options:
  --no-headless         Run browser in non-headless mode (visible)
  --output-dir <path>   Output directory for scraped data (default: ../output)
  --retry-attempts <n>  Number of retry attempts (default: 3)
  --retry-delay <ms>    Delay between retries in milliseconds (default: 2000)
  --help, -h           Show this help message

Examples:
  node cli.js                           # Run with default options
  node cli.js --no-headless             # Run with visible browser
  node cli.js --output-dir ./data       # Custom output directory
  node cli.js --retry-attempts 5        # More retry attempts
`);
}

/**
 * Main execution function
 */
async function main() {
  try {
    const options = parseArgs();
    
    logger.info('Starting Udyam scraper with options:', options);
    
    // Ensure output directory exists
    await fs.ensureDir(options.outputDir);
    
    // Create and run scraper
    const scraper = new UdyamScraper(options);
    const schema = await scraper.run();
    
    logger.info('Scraping completed successfully!');
    logger.info(`Schema saved to: ${options.outputDir}`);
    logger.info(`Total fields scraped: ${schema.statistics.totalFields}`);
    logger.info(`Steps processed: ${schema.statistics.totalSteps}`);
    
    // Print summary
    console.log('\n=== Scraping Summary ===');
    console.log(`✓ Total Steps: ${schema.statistics.totalSteps}`);
    console.log(`✓ Total Fields: ${schema.statistics.totalFields}`);
    console.log(`✓ Step 1 Fields: ${schema.steps.step1.length}`);
    console.log(`✓ Step 2 Fields: ${schema.steps.step2.length}`);
    console.log(`✓ Validation Rules: ${schema.statistics.validationRules.total}`);
    console.log(`✓ Output Directory: ${options.outputDir}`);
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Scraping failed:', error);
    console.error('\n❌ Scraping failed:', error.message);
    
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main();
}

module.exports = { main, parseArgs };
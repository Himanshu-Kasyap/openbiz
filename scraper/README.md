# Udyam Registration Portal Scraper

A robust web scraper built with Puppeteer to extract form fields and validation rules from the Udyam registration portal (https://udyamregistration.gov.in/UdyamRegistration.aspx).

## Features

- **Form Field Extraction**: Automatically extracts all form fields from Steps 1 & 2 of the Udyam registration process
- **Validation Rule Detection**: Identifies and extracts validation patterns, length constraints, and required field rules
- **Schema Generation**: Creates structured JSON schemas for frontend consumption
- **Error Handling**: Robust retry logic and graceful error handling for network failures
- **Comprehensive Testing**: Full unit test coverage with integration tests
- **CLI Interface**: Easy-to-use command-line interface for running scraping operations

## Installation

```bash
npm install
```

## Usage

### Command Line Interface

```bash
# Run with default options
npm run scrape

# Run with custom options
node src/cli.js --no-headless --output-dir ./custom-output --retry-attempts 5

# Available options:
# --no-headless         Run browser in visible mode (for debugging)
# --output-dir <path>   Custom output directory (default: ./output)
# --retry-attempts <n>  Number of retry attempts (default: 3)
# --retry-delay <ms>    Delay between retries (default: 2000ms)
# --help               Show help information
```

### Programmatic Usage

```javascript
const UdyamScraper = require('./src/scraper');

const scraper = new UdyamScraper({
  outputDir: './output',
  headless: true,
  retryAttempts: 3,
  retryDelay: 2000
});

// Run complete scraping process
const schema = await scraper.run();

// Or run individual steps
await scraper.initialize();
const formSchema = await scraper.scrapeFormStructure();
await scraper.saveScrapedData(formSchema);
await scraper.cleanup();
```

## Output Format

The scraper generates a comprehensive JSON schema with the following structure:

```json
{
  "version": "1.0.0",
  "scrapedAt": "2024-01-01T00:00:00.000Z",
  "sourceUrl": "https://udyamregistration.gov.in/UdyamRegistration.aspx",
  "metadata": {
    "totalSteps": 2,
    "totalFields": 8,
    "description": "Udyam Registration Portal - Steps 1 & 2 Form Schema"
  },
  "steps": {
    "step1": [
      {
        "id": "aadhaar_input",
        "name": "aadhaarNumber",
        "type": "text",
        "label": "Aadhaar Number",
        "required": true,
        "validationRules": [
          {
            "type": "pattern",
            "value": "^[0-9]{12}$",
            "message": "Aadhaar number must be 12 digits"
          }
        ],
        "metadata": {
          "fieldCategory": "identity_aadhaar",
          "uiHints": {
            "inputMode": "numeric",
            "placeholder": "Enter 12-digit Aadhaar number",
            "maxLength": 12
          }
        }
      }
    ],
    "step2": [...]
  },
  "validationRules": {
    "aadhaar": {
      "pattern": "^[0-9]{12}$",
      "message": "Aadhaar number must be 12 digits"
    },
    "pan": {
      "pattern": "[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}",
      "message": "PAN must be in format: 5 letters, 4 digits, 1 letter"
    }
  },
  "statistics": {
    "totalFields": 8,
    "fieldsByType": { "text": 6, "select": 2 },
    "validationRules": { "total": 12, "byType": { "required": 6, "pattern": 6 } }
  }
}
```

## Architecture

The scraper is built with a modular architecture:

- **UdyamScraper**: Main orchestrator class
- **FormFieldExtractor**: Processes raw DOM elements into structured form fields
- **ValidationRuleExtractor**: Extracts and infers validation rules from various sources
- **SchemaGenerator**: Creates the final JSON schema with metadata and statistics

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run only unit tests (skip integration tests)
SKIP_INTEGRATION=true npm test
```

### Test Coverage

The project maintains high test coverage:
- Unit tests for all core components
- Integration tests for end-to-end workflows
- Mock-based testing for external dependencies
- Error scenario testing

## Error Handling

The scraper includes comprehensive error handling:

- **Network Failures**: Automatic retry with exponential backoff
- **DOM Changes**: Graceful fallback to predefined field structures
- **Browser Crashes**: Proper cleanup and resource management
- **Validation Errors**: Detailed error messages and logging

## Logging

Structured logging with Winston:
- Console output for development
- File-based logging for production
- Configurable log levels
- Error aggregation and monitoring support

## Configuration

Environment variables:
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `SKIP_INTEGRATION`: Skip integration tests

## Dependencies

- **puppeteer**: Headless Chrome automation
- **cheerio**: Server-side HTML parsing
- **winston**: Structured logging
- **fs-extra**: Enhanced file system operations
- **jest**: Testing framework

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   - Ensure Chrome/Chromium is installed
   - Check system dependencies for Puppeteer
   - Try running with `--no-headless` for debugging

2. **Network Timeouts**
   - Increase retry attempts and delay
   - Check internet connectivity
   - Verify the Udyam portal is accessible

3. **Permission Errors**
   - Ensure write permissions for output directory
   - Check file system permissions

4. **Memory Issues**
   - Close browser instances properly
   - Monitor memory usage during scraping
   - Consider running with limited concurrency

### Debug Mode

Run with visible browser for debugging:
```bash
node src/cli.js --no-headless
```

This allows you to see the browser actions and identify issues with page navigation or element selection.
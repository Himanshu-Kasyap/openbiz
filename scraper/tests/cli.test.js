/**
 * @fileoverview Unit tests for CLI script
 */

const { parseArgs } = require('../src/cli');

describe('CLI', () => {
  let originalArgv;

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('parseArgs', () => {
    it('should parse default options', () => {
      process.argv = ['node', 'cli.js'];
      
      const options = parseArgs();
      
      expect(options.headless).toBe(true);
      expect(options.retryAttempts).toBe(3);
      expect(options.retryDelay).toBe(2000);
      expect(options.outputDir).toContain('output');
    });

    it('should parse --no-headless option', () => {
      process.argv = ['node', 'cli.js', '--no-headless'];
      
      const options = parseArgs();
      
      expect(options.headless).toBe(false);
    });

    it('should parse --output-dir option', () => {
      process.argv = ['node', 'cli.js', '--output-dir', '/custom/path'];
      
      const options = parseArgs();
      
      expect(options.outputDir).toBe('/custom/path');
    });

    it('should parse --retry-attempts option', () => {
      process.argv = ['node', 'cli.js', '--retry-attempts', '5'];
      
      const options = parseArgs();
      
      expect(options.retryAttempts).toBe(5);
    });

    it('should parse --retry-delay option', () => {
      process.argv = ['node', 'cli.js', '--retry-delay', '5000'];
      
      const options = parseArgs();
      
      expect(options.retryDelay).toBe(5000);
    });

    it('should parse multiple options', () => {
      process.argv = [
        'node', 'cli.js',
        '--no-headless',
        '--output-dir', '/test/output',
        '--retry-attempts', '2',
        '--retry-delay', '1000'
      ];
      
      const options = parseArgs();
      
      expect(options.headless).toBe(false);
      expect(options.outputDir).toBe('/test/output');
      expect(options.retryAttempts).toBe(2);
      expect(options.retryDelay).toBe(1000);
    });

    it('should handle unknown options gracefully', () => {
      process.argv = ['node', 'cli.js', '--unknown-option', 'value'];
      
      // Should not throw
      expect(() => parseArgs()).not.toThrow();
    });
  });
});
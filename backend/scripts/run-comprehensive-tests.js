#!/usr/bin/env node

/**
 * @fileoverview Comprehensive test runner script
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test suite configuration
 */
const TEST_SUITES = {
  unit: {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    timeout: 60000,
    required: true
  },
  integration: {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    timeout: 120000,
    required: true
  },
  security: {
    name: 'Security Tests',
    command: 'npm run test:security',
    timeout: 120000,
    required: true
  },
  performance: {
    name: 'Performance Tests',
    command: 'npm run test:performance',
    timeout: 300000,
    required: false
  },
  load: {
    name: 'Load Tests',
    command: 'npm run test:load',
    timeout: 600000,
    required: false
  },
  benchmark: {
    name: 'Benchmark Tests',
    command: 'npm run test:benchmark',
    timeout: 600000,
    required: false
  }
};

/**
 * Colors for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with colors
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Run a test suite
 */
async function runTestSuite(suiteKey, suite) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 Running ${suite.name}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
  
  const startTime = Date.now();
  
  try {
    execSync(suite.command, {
      stdio: 'inherit',
      timeout: suite.timeout,
      cwd: process.cwd()
    });
    
    const duration = Date.now() - startTime;
    log(`✅ ${suite.name} completed successfully in ${duration}ms`, 'green');
    
    return { success: true, duration, suite: suiteKey };
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${suite.name} failed after ${duration}ms`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    return { success: false, duration, suite: suiteKey, error: error.message };
  }
}

/**
 * Generate test report
 */
function generateReport(results) {
  log(`\n${'='.repeat(60)}`, 'magenta');
  log(`📊 Test Results Summary`, 'bright');
  log(`${'='.repeat(60)}`, 'magenta');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  log(`\nOverall Results:`, 'bright');
  log(`  Total Suites: ${totalTests}`);
  log(`  Passed: ${passedTests}`, passedTests > 0 ? 'green' : 'reset');
  log(`  Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'reset');
  log(`  Total Duration: ${totalDuration}ms`);
  
  log(`\nDetailed Results:`, 'bright');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    const suite = TEST_SUITES[result.suite];
    
    log(`  ${status} ${suite.name} (${result.duration}ms)`, color);
    if (!result.success && result.error) {
      log(`    Error: ${result.error}`, 'red');
    }
  });
  
  // Check if all required tests passed
  const requiredTests = results.filter(r => TEST_SUITES[r.suite].required);
  const requiredPassed = requiredTests.filter(r => r.success).length;
  const requiredTotal = requiredTests.length;
  
  log(`\nRequired Tests: ${requiredPassed}/${requiredTotal}`, 'bright');
  
  if (requiredPassed === requiredTotal) {
    log(`\n🎉 All required tests passed!`, 'green');
    return true;
  } else {
    log(`\n💥 ${requiredTotal - requiredPassed} required test(s) failed!`, 'red');
    return false;
  }
}

/**
 * Save results to file
 */
function saveResults(results) {
  const reportPath = path.join(__dirname, '..', 'test-results.json');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0)
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Test results saved to: ${reportPath}`, 'blue');
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const suitesToRun = args.length > 0 ? args : Object.keys(TEST_SUITES);
  
  log(`🚀 Starting comprehensive test suite`, 'bright');
  log(`Running suites: ${suitesToRun.join(', ')}`, 'cyan');
  
  // Validate environment
  if (!process.env.TEST_DATABASE_URL) {
    log(`⚠️  Warning: TEST_DATABASE_URL not set, some tests may fail`, 'yellow');
  }
  
  const results = [];
  
  // Run each test suite
  for (const suiteKey of suitesToRun) {
    if (!TEST_SUITES[suiteKey]) {
      log(`❌ Unknown test suite: ${suiteKey}`, 'red');
      continue;
    }
    
    const result = await runTestSuite(suiteKey, TEST_SUITES[suiteKey]);
    results.push(result);
    
    // Stop on required test failure if in CI mode
    if (!result.success && TEST_SUITES[suiteKey].required && process.env.CI) {
      log(`\n💥 Required test failed in CI mode, stopping execution`, 'red');
      break;
    }
  }
  
  // Generate and save report
  const allPassed = generateReport(results);
  saveResults(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`💥 Test runner failed: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { runTestSuite, generateReport, TEST_SUITES };
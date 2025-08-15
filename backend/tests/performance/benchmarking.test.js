/**
 * @fileoverview Performance benchmarking tests for API endpoints
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const { initializeApp } = require('../../src/server');

describe('Performance - Benchmarking Tests', () => {
  let app;

  beforeAll(async () => {
    app = await initializeApp();
  });

  afterAll(async () => {
    if (global.testPrisma) {
      await global.testPrisma.$disconnect();
    }
  });

  /**
   * Helper function to measure response time statistics
   * @param {Array<number>} times - Array of response times in milliseconds
   * @returns {Object} Statistics object
   */
  function calculateStats(times) {
    const sorted = times.sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b) / times.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { mean, median, p95, p99, min, max };
  }

  describe('Registration Endpoint Benchmarks', () => {
    it('should benchmark Step 1 registration performance', async () => {
      const iterations = 100;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: `12345678901${(i % 10)}`,
            otp: '123456'
          });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(201);
      }

      const stats = calculateStats(responseTimes);

      console.log('Step 1 Registration Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Performance benchmarks
      expect(stats.mean).toBeLessThan(500);
      expect(stats.p95).toBeLessThan(1000);
      expect(stats.p99).toBeLessThan(2000);
    }, 60000);

    it('should benchmark Step 2 registration performance', async () => {
      const iterations = 50;
      const responseTimes = [];
      const sessionIds = [];

      // First create sessions for step 2
      for (let i = 0; i < iterations; i++) {
        const sessionResponse = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: `12345678901${(i % 10)}`,
            otp: '123456'
          });
        sessionIds.push(sessionResponse.body.sessionId);
      }

      // Now benchmark step 2
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId: sessionIds[i],
            panNumber: `ABCDE123${i}F`,
            personalDetails: {
              firstName: `User${i}`,
              lastName: 'Test',
              dateOfBirth: '1990-01-01',
              gender: 'male',
              mobileNumber: `987654321${i}`,
              email: `user${i}@example.com`,
              address: {
                street: `${i} Test Street`,
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
              }
            }
          });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(201);
      }

      const stats = calculateStats(responseTimes);

      console.log('Step 2 Registration Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Performance benchmarks (step 2 involves more database operations)
      expect(stats.mean).toBeLessThan(1000);
      expect(stats.p95).toBeLessThan(2000);
      expect(stats.p99).toBeLessThan(3000);
    }, 60000);

    it('should benchmark status retrieval performance', async () => {
      // Setup: Create a session
      const setupResponse = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = setupResponse.body.sessionId;
      const iterations = 200;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/v1/registration/${sessionId}/status`);

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      const stats = calculateStats(responseTimes);

      console.log('Status Retrieval Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Status retrieval should be very fast (read-only operation)
      expect(stats.mean).toBeLessThan(100);
      expect(stats.p95).toBeLessThan(200);
      expect(stats.p99).toBeLessThan(500);
    }, 30000);
  });

  describe('Utility Endpoint Benchmarks', () => {
    it('should benchmark PIN code location lookup performance', async () => {
      const iterations = 50;
      const responseTimes = [];
      const pinCodes = ['110001', '400001', '560001', '600001', '700001'];

      for (let i = 0; i < iterations; i++) {
        const pinCode = pinCodes[i % pinCodes.length];
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/v1/pincode/${pinCode}/location`);

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect([200, 503]).toContain(response.status);
      }

      const stats = calculateStats(responseTimes);

      console.log('PIN Code Lookup Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // PIN code lookup involves external API calls, so more lenient
      expect(stats.mean).toBeLessThan(2000);
      expect(stats.p95).toBeLessThan(5000);
    }, 60000);

    it('should benchmark form schema retrieval performance', async () => {
      const iterations = 100;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/form-schema');

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      const stats = calculateStats(responseTimes);

      console.log('Form Schema Retrieval Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Form schema should be fast (likely cached)
      expect(stats.mean).toBeLessThan(100);
      expect(stats.p95).toBeLessThan(200);
      expect(stats.p99).toBeLessThan(500);
    }, 30000);

    it('should benchmark field validation performance', async () => {
      const iterations = 200;
      const responseTimes = [];
      const fields = ['aadhaarNumber', 'panNumber', 'email', 'mobileNumber'];
      const values = ['123456789012', 'ABCDE1234F', 'test@example.com', '9876543210'];

      for (let i = 0; i < iterations; i++) {
        const fieldIndex = i % fields.length;
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: fields[fieldIndex],
            value: values[fieldIndex]
          });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      const stats = calculateStats(responseTimes);

      console.log('Field Validation Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Field validation should be very fast
      expect(stats.mean).toBeLessThan(50);
      expect(stats.p95).toBeLessThan(100);
      expect(stats.p99).toBeLessThan(200);
    }, 30000);
  });

  describe('Database Operation Benchmarks', () => {
    it('should benchmark database write operations', async () => {
      const iterations = 50;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        // Step 1 involves database write
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: `12345678901${(i % 10)}`,
            otp: '123456'
          });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(201);
      }

      const stats = calculateStats(responseTimes);

      console.log('Database Write Operations Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Database writes should be reasonably fast
      expect(stats.mean).toBeLessThan(500);
      expect(stats.p95).toBeLessThan(1000);
    }, 60000);

    it('should benchmark database read operations', async () => {
      // Setup: Create a session
      const setupResponse = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = setupResponse.body.sessionId;
      const iterations = 100;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/v1/registration/${sessionId}/status`);

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      const stats = calculateStats(responseTimes);

      console.log('Database Read Operations Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);

      // Database reads should be very fast
      expect(stats.mean).toBeLessThan(100);
      expect(stats.p95).toBeLessThan(200);
    }, 30000);
  });

  describe('Caching Performance Benchmarks', () => {
    it('should benchmark cache hit vs cache miss performance', async () => {
      const pinCode = '110001';
      const iterations = 20;
      
      // First request (cache miss)
      const cacheMissTimes = [];
      for (let i = 0; i < 5; i++) {
        // Clear cache by using different PIN codes
        const uniquePinCode = `11000${i}`;
        const startTime = Date.now();
        
        await request(app)
          .get(`/api/v1/pincode/${uniquePinCode}/location`);

        const endTime = Date.now();
        cacheMissTimes.push(endTime - startTime);
      }

      // Subsequent requests (cache hits)
      const cacheHitTimes = [];
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get(`/api/v1/pincode/${pinCode}/location`);

        const endTime = Date.now();
        cacheHitTimes.push(endTime - startTime);
      }

      const cacheMissStats = calculateStats(cacheMissTimes);
      const cacheHitStats = calculateStats(cacheHitTimes);

      console.log('Cache Performance Benchmark:');
      console.log(`  Cache Miss - Mean: ${cacheMissStats.mean.toFixed(2)}ms`);
      console.log(`  Cache Hit - Mean: ${cacheHitStats.mean.toFixed(2)}ms`);
      console.log(`  Performance Improvement: ${(cacheMissStats.mean / cacheHitStats.mean).toFixed(2)}x`);

      // Cache hits should be significantly faster than cache misses
      expect(cacheHitStats.mean).toBeLessThan(cacheMissStats.mean);
      expect(cacheHitStats.mean).toBeLessThan(100); // Cache hits should be very fast
    }, 30000);
  });

  describe('Error Handling Performance Benchmarks', () => {
    it('should benchmark validation error performance', async () => {
      const iterations = 100;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: 'invalid', // Invalid format
            otp: 'invalid'
          });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(400);
      }

      const stats = calculateStats(responseTimes);

      console.log('Validation Error Handling Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);
      console.log(`  99th percentile: ${stats.p99}ms`);

      // Error handling should be fast
      expect(stats.mean).toBeLessThan(100);
      expect(stats.p95).toBeLessThan(200);
    }, 30000);

    it('should benchmark 404 error performance', async () => {
      const iterations = 50;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/nonexistent-endpoint');

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(404);
      }

      const stats = calculateStats(responseTimes);

      console.log('404 Error Handling Benchmark:');
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median}ms`);
      console.log(`  95th percentile: ${stats.p95}ms`);

      // 404 handling should be very fast
      expect(stats.mean).toBeLessThan(50);
      expect(stats.p95).toBeLessThan(100);
    }, 15000);
  });

  describe('Throughput Benchmarks', () => {
    it('should measure maximum throughput for read operations', async () => {
      const duration = 10000; // 10 seconds
      const startTime = Date.now();
      let requestCount = 0;
      const promises = [];

      // Setup: Create a session
      const setupResponse = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = setupResponse.body.sessionId;

      while (Date.now() - startTime < duration) {
        promises.push(
          request(app)
            .get(`/api/v1/registration/${sessionId}/status`)
            .then(() => requestCount++)
        );

        // Limit concurrent requests to prevent overwhelming the system
        if (promises.length >= 50) {
          await Promise.all(promises);
          promises.length = 0;
        }
      }

      // Wait for remaining requests
      await Promise.all(promises);

      const actualDuration = Date.now() - startTime;
      const throughput = (requestCount / actualDuration) * 1000; // requests per second

      console.log(`Read Throughput Benchmark:`);
      console.log(`  Duration: ${actualDuration}ms`);
      console.log(`  Total requests: ${requestCount}`);
      console.log(`  Throughput: ${throughput.toFixed(2)} requests/second`);

      // Should handle at least 100 requests per second for read operations
      expect(throughput).toBeGreaterThan(100);
    }, 15000);

    it('should measure maximum throughput for write operations', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let requestCount = 0;
      const promises = [];

      while (Date.now() - startTime < duration) {
        promises.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: `12345678901${requestCount % 10}`,
              otp: '123456'
            })
            .then(() => requestCount++)
        );

        // Limit concurrent requests
        if (promises.length >= 20) {
          await Promise.all(promises);
          promises.length = 0;
        }
      }

      // Wait for remaining requests
      await Promise.all(promises);

      const actualDuration = Date.now() - startTime;
      const throughput = (requestCount / actualDuration) * 1000; // requests per second

      console.log(`Write Throughput Benchmark:`);
      console.log(`  Duration: ${actualDuration}ms`);
      console.log(`  Total requests: ${requestCount}`);
      console.log(`  Throughput: ${throughput.toFixed(2)} requests/second`);

      // Should handle at least 50 requests per second for write operations
      expect(throughput).toBeGreaterThan(50);
    }, 10000);
  });
});
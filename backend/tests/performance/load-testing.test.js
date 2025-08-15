/**
 * @fileoverview Load testing for API performance under stress
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const { initializeApp } = require('../../src/server');

describe('Performance - Load Testing', () => {
  let app;

  beforeAll(async () => {
    app = await initializeApp();
  });

  afterAll(async () => {
    if (global.testPrisma) {
      await global.testPrisma.$disconnect();
    }
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent step 1 registrations', async () => {
      const concurrentRequests = 50;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: `12345678901${i.toString().padStart(1, '0')}`,
              otp: '123456'
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / concurrentRequests;

      // All requests should succeed
      const successfulResponses = responses.filter(r => r.status === 201);
      expect(successfulResponses.length).toBe(concurrentRequests);

      // Average response time should be reasonable (under 1 second)
      expect(averageResponseTime).toBeLessThan(1000);

      // Total time should be reasonable for concurrent processing
      expect(totalTime).toBeLessThan(5000);

      console.log(`Concurrent requests: ${concurrentRequests}`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average response time: ${averageResponseTime}ms`);
    }, 30000);

    it('should handle mixed endpoint load', async () => {
      const totalRequests = 100;
      const requests = [];

      // Mix of different endpoint types
      for (let i = 0; i < totalRequests; i++) {
        const requestType = i % 4;
        
        switch (requestType) {
          case 0:
            // Step 1 registration
            requests.push(
              request(app)
                .post('/api/v1/registration/step1')
                .send({
                  aadhaarNumber: `12345678901${(i % 10)}`,
                  otp: '123456'
                })
            );
            break;
            
          case 1:
            // PIN code lookup
            requests.push(
              request(app)
                .get(`/api/v1/pincode/${110001 + (i % 100)}/location`)
            );
            break;
            
          case 2:
            // Form schema request
            requests.push(
              request(app)
                .get('/api/v1/form-schema')
            );
            break;
            
          case 3:
            // Field validation
            requests.push(
              request(app)
                .post('/api/v1/validate-field')
                .send({
                  field: 'aadhaarNumber',
                  value: `12345678901${(i % 10)}`
                })
            );
            break;
        }
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / totalRequests;

      // Most requests should succeed (allowing for some rate limiting)
      const successfulResponses = responses.filter(r => r.status < 400);
      expect(successfulResponses.length).toBeGreaterThan(totalRequests * 0.8);

      // Performance should be reasonable
      expect(averageResponseTime).toBeLessThan(500);
      expect(totalTime).toBeLessThan(10000);

      console.log(`Mixed load test - Total requests: ${totalRequests}`);
      console.log(`Successful responses: ${successfulResponses.length}`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average response time: ${averageResponseTime}ms`);
    }, 30000);
  });

  describe('Database Performance Under Load', () => {
    it('should maintain database performance with concurrent writes', async () => {
      const concurrentWrites = 25;
      const requests = [];

      // Create sessions first
      const sessionRequests = [];
      for (let i = 0; i < concurrentWrites; i++) {
        sessionRequests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: `12345678901${i.toString().padStart(1, '0')}`,
              otp: '123456'
            })
        );
      }

      const sessionResponses = await Promise.all(sessionRequests);
      const sessionIds = sessionResponses.map(r => r.body.sessionId);

      // Now perform concurrent step 2 operations (database writes)
      for (let i = 0; i < concurrentWrites; i++) {
        requests.push(
          request(app)
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
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / concurrentWrites;

      // All database writes should succeed
      const successfulWrites = responses.filter(r => r.status === 201);
      expect(successfulWrites.length).toBe(concurrentWrites);

      // Database performance should be reasonable
      expect(averageResponseTime).toBeLessThan(2000);
      expect(totalTime).toBeLessThan(10000);

      console.log(`Concurrent database writes: ${concurrentWrites}`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average response time: ${averageResponseTime}ms`);
    }, 30000);

    it('should handle concurrent database reads efficiently', async () => {
      // First create some test data
      const setupResponse = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      const sessionId = setupResponse.body.sessionId;

      // Perform concurrent reads
      const concurrentReads = 50;
      const requests = [];

      for (let i = 0; i < concurrentReads; i++) {
        requests.push(
          request(app)
            .get(`/api/v1/registration/${sessionId}/status`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / concurrentReads;

      // All reads should succeed
      const successfulReads = responses.filter(r => r.status === 200);
      expect(successfulReads.length).toBe(concurrentReads);

      // Read performance should be very fast
      expect(averageResponseTime).toBeLessThan(100);
      expect(totalTime).toBeLessThan(2000);

      console.log(`Concurrent database reads: ${concurrentReads}`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average response time: ${averageResponseTime}ms`);
    }, 15000);
  });

  describe('Memory Usage Under Load', () => {
    it('should not have memory leaks during sustained load', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 10;
      const requestsPerIteration = 20;

      for (let iteration = 0; iteration < iterations; iteration++) {
        const requests = [];
        
        for (let i = 0; i < requestsPerIteration; i++) {
          requests.push(
            request(app)
              .post('/api/v1/registration/step1')
              .send({
                aadhaarNumber: `12345678901${i}`,
                otp: '123456'
              })
          );
        }

        await Promise.all(requests);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      console.log(`Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB (${memoryIncreasePercent.toFixed(2)}%)`);

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }, 30000);
  });

  describe('External API Performance Under Load', () => {
    it('should handle concurrent PIN code lookups efficiently', async () => {
      const concurrentLookups = 20;
      const requests = [];
      const pinCodes = ['110001', '400001', '560001', '600001', '700001'];

      for (let i = 0; i < concurrentLookups; i++) {
        const pinCode = pinCodes[i % pinCodes.length];
        requests.push(
          request(app)
            .get(`/api/v1/pincode/${pinCode}/location`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / concurrentLookups;

      // Most requests should succeed (allowing for external API limitations)
      const successfulLookups = responses.filter(r => r.status === 200);
      expect(successfulLookups.length).toBeGreaterThan(concurrentLookups * 0.7);

      // Should benefit from caching after first request
      expect(averageResponseTime).toBeLessThan(1000);

      console.log(`Concurrent PIN code lookups: ${concurrentLookups}`);
      console.log(`Successful lookups: ${successfulLookups.length}`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average response time: ${averageResponseTime}ms`);
    }, 20000);
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting gracefully under load', async () => {
      const totalRequests = 150; // Exceeds rate limit
      const requests = [];

      for (let i = 0; i < totalRequests; i++) {
        requests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: `12345678901${(i % 10)}`,
              otp: '123456'
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const successfulRequests = responses.filter(r => r.status === 201);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      // Should have a mix of successful and rate-limited requests
      expect(successfulRequests.length).toBeGreaterThan(0);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length + rateLimitedRequests.length).toBe(totalRequests);

      // Rate limiting should not significantly impact performance
      expect(totalTime).toBeLessThan(15000);

      console.log(`Rate limiting test - Total requests: ${totalRequests}`);
      console.log(`Successful: ${successfulRequests.length}`);
      console.log(`Rate limited: ${rateLimitedRequests.length}`);
      console.log(`Total time: ${totalTime}ms`);
    }, 30000);
  });

  describe('Response Time Consistency', () => {
    it('should maintain consistent response times under varying load', async () => {
      const testRounds = 5;
      const requestsPerRound = [10, 25, 50, 25, 10]; // Varying load
      const responseTimes = [];

      for (let round = 0; round < testRounds; round++) {
        const requests = [];
        const requestCount = requestsPerRound[round];

        for (let i = 0; i < requestCount; i++) {
          requests.push(
            request(app)
              .get('/api/v1/form-schema')
          );
        }

        const startTime = Date.now();
        const responses = await Promise.all(requests);
        const endTime = Date.now();

        const averageTime = (endTime - startTime) / requestCount;
        responseTimes.push(averageTime);

        // All requests should succeed
        const successfulRequests = responses.filter(r => r.status === 200);
        expect(successfulRequests.length).toBe(requestCount);
      }

      // Calculate coefficient of variation for response times
      const mean = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      const variance = responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responseTimes.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = standardDeviation / mean;

      console.log(`Response times: ${responseTimes.map(t => Math.round(t)).join(', ')}ms`);
      console.log(`Mean: ${Math.round(mean)}ms, CV: ${coefficientOfVariation.toFixed(3)}`);

      // Response times should be relatively consistent (CV < 0.5)
      expect(coefficientOfVariation).toBeLessThan(0.5);
    }, 20000);
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully under high load', async () => {
      const totalRequests = 50;
      const requests = [];

      // Mix of valid and invalid requests
      for (let i = 0; i < totalRequests; i++) {
        const isValid = i % 3 === 0; // 1/3 valid, 2/3 invalid
        
        requests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: isValid ? '123456789012' : 'invalid',
              otp: isValid ? '123456' : 'invalid'
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const validRequests = Math.floor(totalRequests / 3);
      const invalidRequests = totalRequests - validRequests;

      const successfulResponses = responses.filter(r => r.status === 201);
      const errorResponses = responses.filter(r => r.status === 400);

      // Should handle both valid and invalid requests appropriately
      expect(successfulResponses.length).toBe(validRequests);
      expect(errorResponses.length).toBe(invalidRequests);

      // Error handling should not significantly impact performance
      expect(totalTime).toBeLessThan(10000);

      console.log(`Error handling test - Total: ${totalRequests}, Valid: ${validRequests}, Invalid: ${invalidRequests}`);
      console.log(`Total time: ${totalTime}ms`);
    }, 15000);
  });
});
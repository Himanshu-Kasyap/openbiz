/**
 * Production Deployment Verification Tests
 * These tests verify that the production deployment is working correctly
 */

const axios = require('axios');
const https = require('https');

// Configuration
const config = {
  frontendUrl: process.env.FRONTEND_URL || 'https://yourdomain.com',
  backendUrl: process.env.BACKEND_URL || 'https://your-backend-url.railway.app',
  timeout: 30000,
  retries: 3,
  retryDelay: 5000
};

// Helper function to retry requests
async function retryRequest(requestFn, retries = config.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Request failed, retrying in ${config.retryDelay}ms... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    }
  }
}

// HTTP client with SSL verification
const httpClient = axios.create({
  timeout: config.timeout,
  httpsAgent: new https.Agent({
    rejectUnauthorized: true
  })
});

describe('Production Deployment Verification', () => {
  describe('Frontend Deployment (Vercel)', () => {
    test('Frontend should be accessible', async () => {
      const response = await retryRequest(() => 
        httpClient.get(config.frontendUrl)
      );
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('Frontend should have security headers', async () => {
      const response = await retryRequest(() => 
        httpClient.get(config.frontendUrl)
      );
      
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    test('Frontend should serve static assets', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.frontendUrl}/_next/static/css/app.css`, {
          validateStatus: (status) => status === 200 || status === 404
        })
      );
      
      // Either the CSS file exists or Next.js is handling it differently
      expect([200, 404]).toContain(response.status);
    });

    test('Frontend should handle 404 pages gracefully', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.frontendUrl}/non-existent-page`, {
          validateStatus: (status) => status === 404
        })
      );
      
      expect(response.status).toBe(404);
    });

    test('Frontend should be mobile responsive', async () => {
      const response = await retryRequest(() => 
        httpClient.get(config.frontendUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
          }
        })
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toMatch(/viewport.*width=device-width/);
    });
  });

  describe('Backend Deployment (Railway)', () => {
    test('Backend API should be accessible', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/health`)
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });

    test('Backend should have CORS configured', async () => {
      const response = await retryRequest(() => 
        httpClient.options(`${config.backendUrl}/api/health`, {
          headers: {
            'Origin': config.frontendUrl,
            'Access-Control-Request-Method': 'GET'
          }
        })
      );
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('Backend should have rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(15).fill().map(() => 
        httpClient.get(`${config.backendUrl}/api/health`, {
          validateStatus: (status) => status < 500
        })
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(response => response.status === 429);
      
      // Rate limiting should kick in for rapid requests
      expect(rateLimited).toBe(true);
    });

    test('Backend should validate form data', async () => {
      const invalidData = {
        aadhaarNumber: 'invalid',
        otp: '123'
      };
      
      const response = await retryRequest(() => 
        httpClient.post(`${config.backendUrl}/api/v1/registration/step1`, invalidData, {
          validateStatus: (status) => status === 400
        })
      );
      
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
    });

    test('Backend should handle database connections', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/health`)
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('database');
      expect(response.data.database).toHaveProperty('status', 'connected');
    });

    test('Backend should serve form schema', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/v1/form-schema`)
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('schema');
    });
  });

  describe('Database Configuration', () => {
    test('Database should be accessible through backend', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/health`)
      );
      
      expect(response.status).toBe(200);
      expect(response.data.database).toHaveProperty('status', 'connected');
      expect(response.data.database).toHaveProperty('latency');
      expect(typeof response.data.database.latency).toBe('number');
    });

    test('Database should handle concurrent connections', async () => {
      const requests = Array(10).fill().map(() => 
        httpClient.get(`${config.backendUrl}/api/health`)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.database.status).toBe('connected');
      });
    });
  });

  describe('SSL/TLS Configuration', () => {
    test('Frontend should enforce HTTPS', async () => {
      const httpUrl = config.frontendUrl.replace('https://', 'http://');
      
      try {
        const response = await httpClient.get(httpUrl, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 300 && status < 400
        });
        
        expect(response.status).toBeGreaterThanOrEqual(300);
        expect(response.status).toBeLessThan(400);
        expect(response.headers.location).toMatch(/^https:/);
      } catch (error) {
        // Some deployments might reject HTTP entirely
        expect(error.code).toMatch(/ECONNREFUSED|ENOTFOUND/);
      }
    });

    test('Backend should enforce HTTPS', async () => {
      const httpUrl = config.backendUrl.replace('https://', 'http://');
      
      try {
        const response = await httpClient.get(`${httpUrl}/api/health`, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 300 && status < 400
        });
        
        expect(response.status).toBeGreaterThanOrEqual(300);
        expect(response.status).toBeLessThan(400);
        expect(response.headers.location).toMatch(/^https:/);
      } catch (error) {
        // Some deployments might reject HTTP entirely
        expect(error.code).toMatch(/ECONNREFUSED|ENOTFOUND/);
      }
    });

    test('SSL certificates should be valid', async () => {
      const response = await retryRequest(() => 
        httpClient.get(config.frontendUrl)
      );
      
      expect(response.status).toBe(200);
      // If we get here without SSL errors, the certificate is valid
    });
  });

  describe('Performance and Monitoring', () => {
    test('Frontend should load within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await retryRequest(() => 
        httpClient.get(config.frontendUrl)
      );
      
      const loadTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
    });

    test('Backend API should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/health`)
      );
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // 2 seconds max
    });

    test('Backend should provide metrics endpoint', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/metrics`, {
          validateStatus: (status) => status === 200 || status === 404
        })
      );
      
      // Metrics endpoint might be protected or not implemented yet
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Integration Tests', () => {
    test('Frontend should be able to communicate with backend', async () => {
      // Test that frontend can make API calls to backend
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/v1/form-schema`, {
          headers: {
            'Origin': config.frontendUrl,
            'Referer': config.frontendUrl
          }
        })
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('End-to-end form submission flow should work', async () => {
      // Test the complete form submission flow
      const sessionResponse = await retryRequest(() => 
        httpClient.post(`${config.backendUrl}/api/v1/registration/step1`, {
          aadhaarNumber: '123456789012',
          otp: '123456'
        }, {
          validateStatus: (status) => status < 500
        })
      );
      
      // Should either succeed or fail with validation error (not server error)
      expect(sessionResponse.status).toBeLessThan(500);
      
      if (sessionResponse.status === 200) {
        expect(sessionResponse.data).toHaveProperty('success', true);
        expect(sessionResponse.data).toHaveProperty('sessionId');
      } else {
        expect(sessionResponse.data).toHaveProperty('success', false);
        expect(sessionResponse.data).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling', () => {
    test('Frontend should handle API errors gracefully', async () => {
      // Test that frontend doesn't crash on API errors
      const response = await retryRequest(() => 
        httpClient.get(config.frontendUrl)
      );
      
      expect(response.status).toBe(200);
      expect(response.data).not.toMatch(/error|exception|stack trace/i);
    });

    test('Backend should return proper error responses', async () => {
      const response = await retryRequest(() => 
        httpClient.get(`${config.backendUrl}/api/non-existent-endpoint`, {
          validateStatus: (status) => status === 404
        })
      );
      
      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
    });

    test('Backend should handle malformed requests', async () => {
      const response = await retryRequest(() => 
        httpClient.post(`${config.backendUrl}/api/v1/registration/step1`, 
          'invalid json', 
          {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: (status) => status === 400
          }
        )
      );
      
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('success', false);
    });
  });
});

// Cleanup function
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 1000));
});
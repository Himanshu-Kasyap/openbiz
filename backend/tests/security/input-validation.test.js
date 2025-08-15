/**
 * @fileoverview Security tests for input validation and sanitization
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const { initializeApp } = require('../../src/server');

describe('Security - Input Validation Tests', () => {
  let app;

  beforeAll(async () => {
    app = await initializeApp();
  });

  afterAll(async () => {
    if (global.testPrisma) {
      await global.testPrisma.$disconnect();
    }
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in registration endpoints', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (id) VALUES ('hacked'); --",
        "' UNION SELECT * FROM users --"
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: payload,
            otp: '123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should prevent SQL injection in utility endpoints', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE form_schemas; --",
        "' OR 1=1 --",
        "'; DELETE FROM users; --"
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'aadhaarNumber',
            value: payload
          });

        expect(response.status).toBe(200);
        expect(response.body.data.isValid).toBe(false);
      }
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags in form inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'firstName',
            value: payload
          });

        expect(response.status).toBe(200);
        expect(response.body.data.isValid).toBe(false);
        expect(response.body.data.message).not.toContain('<script>');
        expect(response.body.data.message).not.toContain('javascript:');
      }
    });

    it('should prevent XSS in error messages', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '<script>alert("xss")</script>',
          otp: '<img src="x" onerror="alert(1)">'
        });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).not.toContain('<script>');
      expect(JSON.stringify(response.body)).not.toContain('onerror');
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should prevent NoSQL injection attempts', async () => {
      const noSqlPayloads = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.password.length > 0' }
      ];

      for (const payload of noSqlPayloads) {
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: payload,
            otp: '123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should prevent command injection in PIN code lookup', async () => {
      const commandPayloads = [
        '123456; ls -la',
        '123456 && cat /etc/passwd',
        '123456 | whoami',
        '123456; rm -rf /',
        '123456`id`'
      ];

      for (const payload of commandPayloads) {
        const response = await request(app)
          .get(`/api/v1/pincode/${encodeURIComponent(payload)}/location`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal attacks', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const payload of pathTraversalPayloads) {
        const response = await request(app)
          .get(`/api/v1/form-schema/step/${encodeURIComponent(payload)}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Input Size Limits', () => {
    it('should reject oversized JSON payloads', async () => {
      const largeString = 'A'.repeat(11 * 1024 * 1024); // 11MB string

      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: largeString,
          otp: '123456'
        });

      expect(response.status).toBe(413);
    });

    it('should reject extremely long field values', async () => {
      const longString = 'A'.repeat(10000);

      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: longString,
          otp: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Content Type Validation', () => {
    it('should reject non-JSON content types for JSON endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .set('Content-Type', 'text/plain')
        .send('aadhaarNumber=123456789012&otp=123456');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject XML content type', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .set('Content-Type', 'application/xml')
        .send('<?xml version="1.0"?><data><aadhaar>123456789012</aadhaar></data>');

      expect(response.status).toBe(400);
    });
  });

  describe('Header Injection Prevention', () => {
    it('should prevent header injection attacks', async () => {
      const maliciousHeaders = [
        'test\r\nX-Injected: true',
        'test\nSet-Cookie: admin=true',
        'test\r\n\r\n<script>alert("xss")</script>'
      ];

      for (const header of maliciousHeaders) {
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .set('X-Custom-Header', header)
          .send({
            aadhaarNumber: '123456789012',
            otp: '123456'
          });

        expect(response.headers['x-injected']).toBeUndefined();
        expect(response.headers['set-cookie']).toBeUndefined();
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits to prevent brute force attacks', async () => {
      const requests = [];
      
      // Make 101 requests rapidly (exceeds the 100 request limit)
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app)
            .post('/api/v1/registration/step1')
            .send({
              aadhaarNumber: '123456789012',
              otp: '123456'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('CORS Security', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .set('Origin', 'https://malicious-site.com')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      // Should either reject or not include CORS headers
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });
  });

  describe('Session Security', () => {
    it('should generate secure session IDs', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      expect(response.status).toBe(201);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.sessionId.length).toBeGreaterThan(20);
      expect(response.body.sessionId).toMatch(/^[a-zA-Z0-9-_]+$/);
    });

    it('should not accept predictable session IDs', async () => {
      const predictableSessionIds = [
        '123456',
        'admin',
        'session1',
        'user123',
        '00000000-0000-0000-0000-000000000000'
      ];

      for (const sessionId of predictableSessionIds) {
        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId,
            panNumber: 'ABCDE1234F',
            personalDetails: {
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: '1990-01-01',
              gender: 'male',
              mobileNumber: '9876543210',
              email: 'john.doe@example.com',
              address: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
              }
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe('Invalid session. Please start from Step 1.');
      }
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: 'wrong_otp'
        });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).not.toContain('database');
      expect(JSON.stringify(response.body)).not.toContain('prisma');
      expect(JSON.stringify(response.body)).not.toContain('password');
      expect(JSON.stringify(response.body)).not.toContain('secret');
      expect(JSON.stringify(response.body)).not.toContain('token');
    });

    it('should not expose stack traces in production-like errors', async () => {
      // Force an internal error by sending malformed data
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}');

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).not.toContain('at ');
      expect(JSON.stringify(response.body)).not.toContain('.js:');
      expect(JSON.stringify(response.body)).not.toContain('Error:');
    });
  });

  describe('Input Encoding and Sanitization', () => {
    it('should handle Unicode and special characters safely', async () => {
      const unicodePayloads = [
        '🚀💻🔒', // Emojis
        'тест', // Cyrillic
        '测试', // Chinese
        'اختبار', // Arabic
        '\u0000\u0001\u0002', // Control characters
        '\uFEFF', // BOM character
      ];

      for (const payload of unicodePayloads) {
        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'firstName',
            value: payload
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Should handle gracefully without crashing
      }
    });

    it('should sanitize null bytes and control characters', async () => {
      const maliciousPayloads = [
        'test\x00admin',
        'test\x01\x02\x03',
        'test\r\nadmin',
        'test\u0000admin'
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'firstName',
            value: payload
          });

        expect(response.status).toBe(200);
        expect(response.body.data.value).not.toContain('\x00');
        expect(response.body.data.value).not.toContain('\x01');
      }
    });
  });
});
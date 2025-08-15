/**
 * @fileoverview Integration tests for utility API endpoints
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const express = require('express');
const utilityRoutes = require('../../src/routes/utility');
const LocationService = require('../../src/services/locationService');
const FormSchemaService = require('../../src/services/formSchemaService');
const RegistrationService = require('../../src/services/registrationService');
const { errorHandler } = require('../../src/middleware/errorHandler');

// Mock external dependencies
jest.mock('../../src/services/locationService');
jest.mock('../../src/services/formSchemaService');
jest.mock('../../src/services/registrationService');

describe('Utility API Endpoints', () => {
  let app;
  let server;

  beforeAll(() => {
    // Create a simple Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/v1/pincode', utilityRoutes);
    app.use('/api/v1', utilityRoutes);
    app.use(errorHandler);
    
    server = app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PIN Code Location API', () => {
    describe('GET /api/v1/pincode/:code/location', () => {
      it('should return location data for valid PIN code', async () => {
        const mockLocationData = {
          pincode: '110001',
          city: 'New Delhi',
          state: 'Delhi',
          district: 'Central Delhi',
          country: 'India'
        };

        LocationService.getLocationByPincode.mockResolvedValue(mockLocationData);
        LocationService.getCachedLocation.mockReturnValue(null);

        const response = await request(app)
          .get('/api/v1/pincode/110001/location')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: mockLocationData,
          metadata: {
            source: 'location_service',
            timestamp: expect.any(String),
            cached: false
          }
        });
      });

      it('should return cached data on second request', async () => {
        // First request
        await request(server)
          .get('/api/v1/pincode/400001/location')
          .expect(200);

        // Second request should be cached
        const response = await request(server)
          .get('/api/v1/pincode/400001/location')
          .expect(200);

        expect(response.body.metadata.cached).toBe(true);
      });

      it('should return 400 for invalid PIN code format', async () => {
        const response = await request(server)
          .get('/api/v1/pincode/12345/location')
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: expect.stringContaining('PIN code must be exactly 6 digits')
          }
        });
      });

      it('should return 400 for non-numeric PIN code', async () => {
        const response = await request(server)
          .get('/api/v1/pincode/abcdef/location')
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR'
          }
        });
      });

      it('should handle service unavailable gracefully', async () => {
        // Mock all location service methods to fail
        const originalGetLocation = LocationService.getLocationByPincode;
        LocationService.getLocationByPincode = jest.fn().mockRejectedValue(
          new Error('Service unavailable')
        );

        const response = await request(server)
          .get('/api/v1/pincode/999999/location')
          .expect(503);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: expect.any(String),
            message: expect.stringContaining('Unable to fetch location data')
          }
        });

        // Restore original method
        LocationService.getLocationByPincode = originalGetLocation;
      });
    });
  });

  describe('Form Schema API', () => {
    describe('GET /api/v1/form-schema', () => {
      it('should return complete form schema', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            version: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            steps: expect.arrayContaining([
              expect.objectContaining({
                stepNumber: 1,
                title: expect.any(String),
                fields: expect.any(Array)
              }),
              expect.objectContaining({
                stepNumber: 2,
                title: expect.any(String),
                fields: expect.any(Array)
              })
            ]),
            metadata: expect.any(Object)
          },
          metadata: {
            timestamp: expect.any(String),
            totalSteps: 2,
            totalFields: expect.any(Number)
          }
        });
      });

      it('should include all required fields in step 1', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema')
          .expect(200);

        const step1 = response.body.data.steps.find(s => s.stepNumber === 1);
        expect(step1).toBeDefined();
        
        const fieldNames = step1.fields.map(f => f.name);
        expect(fieldNames).toContain('aadhaarNumber');
        expect(fieldNames).toContain('otp');
      });

      it('should include all required fields in step 2', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema')
          .expect(200);

        const step2 = response.body.data.steps.find(s => s.stepNumber === 2);
        expect(step2).toBeDefined();
        
        const fieldNames = step2.fields.map(f => f.name);
        expect(fieldNames).toContain('panNumber');
        expect(fieldNames).toContain('personalDetails.firstName');
        expect(fieldNames).toContain('personalDetails.email');
      });
    });

    describe('GET /api/v1/form-schema/step/:stepNumber', () => {
      it('should return step 1 schema', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema/step/1')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            stepNumber: 1,
            title: expect.any(String),
            description: expect.any(String),
            fields: expect.any(Array)
          }
        });
      });

      it('should return step 2 schema', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema/step/2')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            stepNumber: 2,
            title: expect.any(String),
            fields: expect.any(Array)
          }
        });
      });

      it('should return 400 for invalid step number', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema/step/3')
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR'
          }
        });
      });
    });

    describe('GET /api/v1/form-schema/metadata', () => {
      it('should return schema metadata', async () => {
        const response = await request(server)
          .get('/api/v1/form-schema/metadata')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            version: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            totalSteps: expect.any(Number),
            totalFields: expect.any(Number),
            metadata: expect.any(Object)
          }
        });
      });
    });
  });

  describe('Field Validation API', () => {
    describe('POST /api/v1/validate-field', () => {
      it('should validate valid Aadhaar number', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'aadhaarNumber',
            value: '123456789012'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            field: 'aadhaarNumber',
            value: '123456789012',
            isValid: true,
            message: expect.any(String)
          }
        });
      });

      it('should validate invalid Aadhaar number', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'aadhaarNumber',
            value: '12345'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            field: 'aadhaarNumber',
            value: '12345',
            isValid: false,
            message: expect.stringContaining('12 digits'),
            suggestions: expect.arrayContaining([
              expect.stringContaining('12 digits long')
            ])
          }
        });
      });

      it('should validate valid PAN number', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'panNumber',
            value: 'ABCDE1234F'
          })
          .expect(200);

        expect(response.body.data.isValid).toBe(true);
      });

      it('should validate invalid PAN number format', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'panNumber',
            value: '123INVALID'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            field: 'panNumber',
            isValid: false,
            suggestions: expect.any(Array)
          }
        });
      });

      it('should validate valid email', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'email',
            value: 'test@example.com'
          })
          .expect(200);

        expect(response.body.data.isValid).toBe(true);
      });

      it('should validate invalid email', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'email',
            value: 'invalid-email'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            isValid: false,
            suggestions: expect.arrayContaining([
              expect.stringContaining('@')
            ])
          }
        });
      });

      it('should validate valid mobile number', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'mobileNumber',
            value: '9876543210'
          })
          .expect(200);

        expect(response.body.data.isValid).toBe(true);
      });

      it('should validate invalid mobile number', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'mobileNumber',
            value: '123456789'
          })
          .expect(200);

        expect(response.body.data.isValid).toBe(false);
      });

      it('should return 400 for invalid field name', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'invalidField',
            value: 'test'
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR'
          }
        });
      });

      it('should return 400 for missing field value', async () => {
        const response = await request(server)
          .post('/api/v1/validate-field')
          .send({
            field: 'aadhaarNumber'
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR'
          }
        });
      });
    });
  });

  describe('Form Validation API', () => {
    describe('POST /api/v1/validate-form', () => {
      it('should validate valid step 1 form data', async () => {
        const response = await request(server)
          .post('/api/v1/validate-form')
          .send({
            stepNumber: 1,
            formData: {
              aadhaarNumber: '123456789012',
              otp: '123456'
            }
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            isValid: true,
            errors: [],
            validatedData: expect.any(Object)
          }
        });
      });

      it('should validate invalid step 1 form data', async () => {
        const response = await request(server)
          .post('/api/v1/validate-form')
          .send({
            stepNumber: 1,
            formData: {
              aadhaarNumber: '12345',
              otp: ''
            }
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            isValid: false,
            errors: expect.arrayContaining([
              expect.objectContaining({
                field: expect.any(String),
                errors: expect.any(Array)
              })
            ]),
            validatedData: null
          }
        });
      });

      it('should return 400 for invalid step number', async () => {
        const response = await request(server)
          .post('/api/v1/validate-form')
          .send({
            stepNumber: 5,
            formData: {}
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR'
          }
        });
      });
    });
  });

  describe('Cache Management API', () => {
    describe('GET /api/v1/cache/stats', () => {
      it('should return cache statistics', async () => {
        const response = await request(server)
          .get('/api/v1/cache/stats')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            location_cache: {
              totalEntries: expect.any(Number),
              validEntries: expect.any(Number),
              expiredEntries: expect.any(Number),
              cacheHitRate: expect.any(Number)
            },
            cache_ttl_hours: expect.any(Number)
          }
        });
      });
    });

    describe('POST /api/v1/cache/clear', () => {
      it('should clear expired cache entries', async () => {
        const response = await request(server)
          .post('/api/v1/cache/clear')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            entriesCleared: expect.any(Number),
            remainingEntries: expect.any(Number)
          },
          metadata: {
            timestamp: expect.any(String),
            action: 'cache_clear'
          }
        });
      });
    });
  });

  describe('External API Integration', () => {
    it('should handle PostPin API timeout gracefully', async () => {
      // Mock axios to simulate timeout
      const axios = require('axios');
      const originalGet = axios.get;
      axios.get = jest.fn().mockRejectedValue(new Error('timeout'));

      const response = await request(server)
        .get('/api/v1/pincode/123456/location');

      // Should either return fallback data or service unavailable
      expect([200, 503]).toContain(response.status);

      // Restore original axios
      axios.get = originalGet;
    });

    it('should use fallback data for common PIN codes', async () => {
      // Test with a known fallback PIN code
      const response = await request(server)
        .get('/api/v1/pincode/110001/location')
        .expect(200);

      expect(response.body.data).toMatchObject({
        pincode: '110001',
        city: expect.any(String),
        state: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(server)
        .post('/api/v1/validate-field')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(Object)
      });
    });

    it('should handle missing request body', async () => {
      const response = await request(server)
        .post('/api/v1/validate-field')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR'
        }
      });
    });
  });
});
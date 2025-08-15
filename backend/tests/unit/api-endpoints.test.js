/**
 * @fileoverview Comprehensive unit tests for all API endpoints
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const express = require('express');
const registrationRoutes = require('../../src/routes/registration');
const utilityRoutes = require('../../src/routes/utility');
const healthRoutes = require('../../src/routes/health');
const metricsRoutes = require('../../src/routes/metrics');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { validateRequest } = require('../../src/middleware/validation');

// Mock services
jest.mock('../../src/services/registrationService');
jest.mock('../../src/services/locationService');
jest.mock('../../src/services/formSchemaService');

const RegistrationService = require('../../src/services/registrationService');
const LocationService = require('../../src/services/locationService');
const FormSchemaService = require('../../src/services/formSchemaService');

describe('Unit Tests - API Endpoints', () => {
  let app;

  beforeAll(() => {
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Add routes
    app.use('/api/health', healthRoutes);
    app.use('/api/metrics', metricsRoutes);
    app.use('/api/v1/registration', registrationRoutes);
    app.use('/api/v1/pincode', utilityRoutes);
    app.use('/api/v1', utilityRoutes);
    
    // Error handler
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoints', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        });
      });

      it('should include service dependencies in health check', async () => {
        const response = await request(app)
          .get('/api/health');

        expect(response.body.services).toBeDefined();
        expect(response.body.services.database).toBeDefined();
        expect(response.body.services.redis).toBeDefined();
      });
    });

    describe('GET /api/health/detailed', () => {
      it('should return detailed health information', async () => {
        const response = await request(app)
          .get('/api/health/detailed');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: expect.any(String),
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
          services: expect.any(Object)
        });
      });
    });
  });

  describe('Metrics Endpoints', () => {
    describe('GET /api/metrics', () => {
      it('should return application metrics', async () => {
        const response = await request(app)
          .get('/api/metrics');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          requests: expect.any(Object),
          performance: expect.any(Object),
          errors: expect.any(Object),
          timestamp: expect.any(String)
        });
      });
    });

    describe('GET /api/metrics/performance', () => {
      it('should return performance metrics', async () => {
        const response = await request(app)
          .get('/api/metrics/performance');

        expect(response.status).toBe(200);
        expect(response.body.responseTime).toBeDefined();
        expect(response.body.throughput).toBeDefined();
      });
    });
  });

  describe('Registration Endpoints', () => {
    describe('POST /api/v1/registration/step1', () => {
      it('should process valid step 1 data', async () => {
        const mockResult = {
          success: true,
          sessionId: 'test-session-id',
          nextStep: 2,
          message: 'Aadhaar verification completed successfully'
        };

        RegistrationService.processStep1.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: '123456789012',
            otp: '123456'
          });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockResult);
        expect(RegistrationService.processStep1).toHaveBeenCalledWith({
          aadhaarNumber: '123456789012',
          otp: '123456',
          sessionId: undefined
        });
      });

      it('should validate Aadhaar number format', async () => {
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: '12345', // Invalid format
            otp: '123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should validate OTP format', async () => {
        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: '123456789012',
            otp: '12345' // Invalid format
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle service errors', async () => {
        RegistrationService.processStep1.mockRejectedValue(
          new Error('Service unavailable')
        );

        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: '123456789012',
            otp: '123456'
          });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      it('should accept existing session ID', async () => {
        const mockResult = {
          success: true,
          sessionId: 'existing-session-id',
          nextStep: 2,
          message: 'Aadhaar verification completed successfully'
        };

        RegistrationService.processStep1.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/registration/step1')
          .send({
            aadhaarNumber: '123456789012',
            otp: '123456',
            sessionId: 'existing-session-id'
          });

        expect(response.status).toBe(201);
        expect(RegistrationService.processStep1).toHaveBeenCalledWith({
          aadhaarNumber: '123456789012',
          otp: '123456',
          sessionId: 'existing-session-id'
        });
      });
    });

    describe('POST /api/v1/registration/step2', () => {
      it('should process valid step 2 data', async () => {
        const mockResult = {
          success: true,
          sessionId: 'test-session-id',
          status: 'completed',
          message: 'Registration completed successfully'
        };

        RegistrationService.processStep2.mockResolvedValue(mockResult);

        const personalDetails = {
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
        };

        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId: 'test-session-id',
            panNumber: 'ABCDE1234F',
            personalDetails
          });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockResult);
        expect(RegistrationService.processStep2).toHaveBeenCalledWith({
          sessionId: 'test-session-id',
          panNumber: 'ABCDE1234F',
          personalDetails
        });
      });

      it('should validate PAN number format', async () => {
        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId: 'test-session-id',
            panNumber: 'INVALID123', // Invalid format
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
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should validate required personal details', async () => {
        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId: 'test-session-id',
            panNumber: 'ABCDE1234F',
            personalDetails: {
              firstName: 'John'
              // Missing required fields
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId: 'test-session-id',
            panNumber: 'ABCDE1234F',
            personalDetails: {
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: '1990-01-01',
              gender: 'male',
              mobileNumber: '9876543210',
              email: 'invalid-email', // Invalid format
              address: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
              }
            }
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should validate mobile number format', async () => {
        const response = await request(app)
          .post('/api/v1/registration/step2')
          .send({
            sessionId: 'test-session-id',
            panNumber: 'ABCDE1234F',
            personalDetails: {
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: '1990-01-01',
              gender: 'male',
              mobileNumber: '1234567890', // Invalid format (doesn't start with 6-9)
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
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/v1/registration/:sessionId/status', () => {
      it('should return registration status for valid session', async () => {
        const mockStatus = {
          sessionId: 'test-session-id',
          status: 'step1_completed',
          currentStep: 2,
          steps: {
            step1: { completed: true, completedAt: '2023-01-01T00:00:00Z' },
            step2: { completed: false }
          },
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        };

        RegistrationService.getRegistrationStatus.mockResolvedValue(mockStatus);

        const response = await request(app)
          .get('/api/v1/registration/test-session-id/status');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockStatus);
        expect(RegistrationService.getRegistrationStatus).toHaveBeenCalledWith('test-session-id');
      });

      it('should validate session ID format', async () => {
        const response = await request(app)
          .get('/api/v1/registration/invalid session id/status');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle non-existent session', async () => {
        RegistrationService.getRegistrationStatus.mockRejectedValue(
          new Error('Session not found')
        );

        const response = await request(app)
          .get('/api/v1/registration/non-existent-session/status');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/registration/validate-field', () => {
      it('should validate field correctly', async () => {
        const mockResult = {
          field: 'aadhaarNumber',
          value: '123456789012',
          isValid: true,
          message: 'Valid Aadhaar number'
        };

        RegistrationService.validateField.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/registration/validate-field')
          .send({
            field: 'aadhaarNumber',
            value: '123456789012'
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResult);
        expect(RegistrationService.validateField).toHaveBeenCalledWith('aadhaarNumber', '123456789012');
      });

      it('should validate field name', async () => {
        const response = await request(app)
          .post('/api/v1/registration/validate-field')
          .send({
            field: 'invalidField',
            value: 'test'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should require field value', async () => {
        const response = await request(app)
          .post('/api/v1/registration/validate-field')
          .send({
            field: 'aadhaarNumber'
            // Missing value
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Utility Endpoints', () => {
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
          .get('/api/v1/pincode/110001/location');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: mockLocationData,
          metadata: expect.objectContaining({
            source: 'location_service',
            timestamp: expect.any(String)
          })
        });
      });

      it('should validate PIN code format', async () => {
        const response = await request(app)
          .get('/api/v1/pincode/12345/location'); // Invalid format

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle location service errors', async () => {
        LocationService.getLocationByPincode.mockRejectedValue(
          new Error('Service unavailable')
        );

        const response = await request(app)
          .get('/api/v1/pincode/999999/location');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/form-schema', () => {
      it('should return complete form schema', async () => {
        const mockSchema = {
          version: '1.0.0',
          title: 'Udyam Registration Form',
          description: 'Complete form schema',
          steps: [
            {
              stepNumber: 1,
              title: 'Aadhaar Verification',
              fields: [
                { name: 'aadhaarNumber', type: 'text', required: true },
                { name: 'otp', type: 'text', required: true }
              ]
            },
            {
              stepNumber: 2,
              title: 'PAN Verification',
              fields: [
                { name: 'panNumber', type: 'text', required: true }
              ]
            }
          ]
        };

        FormSchemaService.getFormSchema.mockResolvedValue(mockSchema);

        const response = await request(app)
          .get('/api/v1/form-schema');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: mockSchema,
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
            totalSteps: 2,
            totalFields: 3
          })
        });
      });

      it('should handle schema service errors', async () => {
        FormSchemaService.getFormSchema.mockRejectedValue(
          new Error('Schema not found')
        );

        const response = await request(app)
          .get('/api/v1/form-schema');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/form-schema/step/:stepNumber', () => {
      it('should return step schema for valid step number', async () => {
        const mockStepSchema = {
          stepNumber: 1,
          title: 'Aadhaar Verification',
          description: 'Step 1 description',
          fields: [
            { name: 'aadhaarNumber', type: 'text', required: true },
            { name: 'otp', type: 'text', required: true }
          ]
        };

        FormSchemaService.getStepSchema.mockResolvedValue(mockStepSchema);

        const response = await request(app)
          .get('/api/v1/form-schema/step/1');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: mockStepSchema,
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
            fieldCount: 2
          })
        });
      });

      it('should validate step number', async () => {
        const response = await request(app)
          .get('/api/v1/form-schema/step/5'); // Invalid step number

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/v1/validate-field', () => {
      it('should validate field with suggestions', async () => {
        const mockResult = {
          field: 'aadhaarNumber',
          value: '12345',
          isValid: false,
          message: 'Aadhaar number must be 12 digits'
        };

        RegistrationService.validateField.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'aadhaarNumber',
            value: '12345'
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            ...mockResult,
            suggestions: expect.arrayContaining([
              expect.stringContaining('12 digits long')
            ])
          }),
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
            validationType: 'real-time'
          })
        });
      });

      it('should provide PAN validation suggestions', async () => {
        const mockResult = {
          field: 'panNumber',
          value: '123INVALID',
          isValid: false,
          message: 'Invalid PAN format'
        };

        RegistrationService.validateField.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'panNumber',
            value: '123INVALID'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.suggestions).toContain('PAN should start with 5 letters');
      });

      it('should provide email validation suggestions', async () => {
        const mockResult = {
          field: 'email',
          value: 'invalid-email',
          isValid: false,
          message: 'Invalid email format'
        };

        RegistrationService.validateField.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/validate-field')
          .send({
            field: 'email',
            value: 'invalid-email'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.suggestions).toEqual(
          expect.arrayContaining([
            expect.stringContaining('@'),
            expect.stringContaining('domain extension')
          ])
        );
      });
    });

    describe('POST /api/v1/validate-form', () => {
      it('should validate complete form data', async () => {
        const mockResult = {
          isValid: true,
          errors: [],
          validatedData: {
            aadhaarNumber: '123456789012',
            otp: '123456'
          }
        };

        FormSchemaService.validateFormData.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/validate-form')
          .send({
            stepNumber: 1,
            formData: {
              aadhaarNumber: '123456789012',
              otp: '123456'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: mockResult,
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
            stepNumber: 1,
            validationType: 'form-level'
          })
        });
      });

      it('should validate step number', async () => {
        const response = await request(app)
          .post('/api/v1/validate-form')
          .send({
            stepNumber: 5, // Invalid step number
            formData: {}
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/v1/cache/stats', () => {
      it('should return cache statistics', async () => {
        const mockStats = {
          totalEntries: 10,
          validEntries: 8,
          expiredEntries: 2,
          cacheHitRate: 0.8
        };

        LocationService.getCacheStats.mockReturnValue(mockStats);

        const response = await request(app)
          .get('/api/v1/cache/stats');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: {
            location_cache: mockStats,
            cache_ttl_hours: expect.any(Number)
          },
          metadata: expect.objectContaining({
            timestamp: expect.any(String)
          })
        });
      });
    });

    describe('POST /api/v1/cache/clear', () => {
      it('should clear expired cache entries', async () => {
        LocationService.cache = new Map([
          ['key1', { data: {}, timestamp: Date.now() }],
          ['key2', { data: {}, timestamp: Date.now() - 1000000 }]
        ]);

        LocationService.clearExpiredCache.mockImplementation(() => {
          // Mock clearing expired entries
        });

        const response = await request(app)
          .post('/api/v1/cache/clear');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          data: {
            entriesCleared: expect.any(Number),
            remainingEntries: expect.any(Number)
          },
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
            action: 'cache_clear'
          })
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send('aadhaarNumber=123456789012&otp=123456');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send();

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({});

      expect(response.body.error.requestId).toBeDefined();
      expect(typeof response.body.error.requestId).toBe('string');
    });

    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle method not allowed', async () => {
      const response = await request(app)
        .delete('/api/v1/registration/step1');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle null values', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: null,
          otp: null
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle undefined values', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: undefined,
          otp: undefined
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle empty strings', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '',
          otp: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle array values where strings expected', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: ['123456789012'],
          otp: ['123456']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle object values where strings expected', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: { value: '123456789012' },
          otp: { value: '123456' }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle very long strings', async () => {
      const longString = 'A'.repeat(10000);

      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: longString,
          otp: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle special characters in strings', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012\n\r\t',
          otp: '123456<script>'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent success response format', async () => {
      const mockResult = {
        success: true,
        sessionId: 'test-session-id',
        nextStep: 2,
        message: 'Success'
      };

      RegistrationService.processStep1.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: '123456789012',
          otp: '123456'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return consistent error response format', async () => {
      const response = await request(app)
        .post('/api/v1/registration/step1')
        .send({
          aadhaarNumber: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    it('should include proper HTTP status codes', async () => {
      // Test various scenarios
      const scenarios = [
        { endpoint: '/api/health', method: 'get', expectedStatus: 200 },
        { endpoint: '/api/v1/form-schema', method: 'get', expectedStatus: 200 },
        { endpoint: '/api/v1/non-existent', method: 'get', expectedStatus: 404 }
      ];

      for (const scenario of scenarios) {
        const response = await request(app)[scenario.method](scenario.endpoint);
        expect(response.status).toBe(scenario.expectedStatus);
      }
    });
  });
});
/**
 * @fileoverview Integration tests for external API interactions
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const request = require('supertest');
const axios = require('axios');
const { initializeApp } = require('../../src/server');
const LocationService = require('../../src/services/locationService');

// Mock axios for controlled testing
jest.mock('axios');
const mockedAxios = axios;

describe('Integration - External API Tests', () => {
  let app;

  beforeAll(async () => {
    app = await initializeApp();
  });

  afterAll(async () => {
    if (global.testPrisma) {
      await global.testPrisma.$disconnect();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear location service cache
    LocationService.cache.clear();
  });

  describe('PostPin API Integration', () => {
    it('should successfully fetch location data from PostPin API', async () => {
      const mockPostPinResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Connaught Place',
            District: 'Central Delhi',
            State: 'Delhi',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockPostPinResponse);

      const response = await request(app)
        .get('/api/v1/pincode/110001/location');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          pincode: '110001',
          city: 'Central Delhi',
          state: 'Delhi',
          district: 'Central Delhi',
          country: 'India'
        }
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/postoffice/110001',
        expect.objectContaining({
          baseURL: 'https://api.postalpincode.in',
          timeout: 5000
        })
      );
    });

    it('should handle PostPin API timeout gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

      const response = await request(app)
        .get('/api/v1/pincode/110001/location');

      // Should either return fallback data or service unavailable
      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        // Should return fallback data for known PIN codes
        expect(response.body.data.pincode).toBe('110001');
      } else {
        // Should return service unavailable error
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle PostPin API rate limiting', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Too Many Requests' }
        }
      });

      const response = await request(app)
        .get('/api/v1/pincode/400001/location');

      // Should handle rate limiting gracefully
      expect([200, 503]).toContain(response.status);
    });

    it('should handle PostPin API invalid response format', async () => {
      const invalidResponses = [
        { data: null },
        { data: [] },
        { data: [{ Status: 'Error', PostOffice: [] }] },
        { data: [{ Status: 'Success', PostOffice: null }] },
        { data: 'invalid format' }
      ];

      for (const invalidResponse of invalidResponses) {
        mockedAxios.get.mockResolvedValue(invalidResponse);

        const response = await request(app)
          .get('/api/v1/pincode/123456/location');

        // Should handle invalid responses gracefully
        expect([200, 503]).toContain(response.status);
      }
    });

    it('should retry PostPin API on network failures', async () => {
      // First call fails, second succeeds
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          data: [{
            Status: 'Success',
            PostOffice: [{
              Name: 'Test Office',
              District: 'Test District',
              State: 'Test State',
              Country: 'India'
            }]
          }]
        });

      const response = await request(app)
        .get('/api/v1/pincode/560001/location');

      expect(response.status).toBe(200);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('India Post API Integration (Fallback)', () => {
    it('should fallback to India Post API when PostPin fails', async () => {
      // Mock PostPin to fail
      mockedAxios.get
        .mockRejectedValueOnce(new Error('PostPin API failed'))
        .mockResolvedValueOnce({
          data: {
            records: [{
              officename: 'Bangalore GPO',
              districtname: 'Bangalore',
              statename: 'Karnataka'
            }]
          }
        });

      const response = await request(app)
        .get('/api/v1/pincode/560001/location');

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        pincode: '560001',
        city: 'Bangalore',
        state: 'Karnataka',
        district: 'Bangalore',
        country: 'India'
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle India Post API errors', async () => {
      // Both APIs fail
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/v1/pincode/999999/location');

      // Should return service unavailable or fallback data
      expect([200, 503]).toContain(response.status);
    });

    it('should handle India Post API invalid response', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('PostPin failed'))
        .mockResolvedValueOnce({
          data: {
            records: [] // Empty records
          }
        });

      const response = await request(app)
        .get('/api/v1/pincode/123456/location');

      expect([200, 503]).toContain(response.status);
    });
  });

  describe('API Caching Behavior', () => {
    it('should cache successful API responses', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Test Office',
            District: 'Test District',
            State: 'Test State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // First request
      const response1 = await request(app)
        .get('/api/v1/pincode/110001/location');

      expect(response1.status).toBe(200);
      expect(response1.body.metadata.cached).toBe(false);

      // Second request should be cached
      const response2 = await request(app)
        .get('/api/v1/pincode/110001/location');

      expect(response2.status).toBe(200);
      expect(response2.body.metadata.cached).toBe(true);

      // API should only be called once
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should not cache failed API responses', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      // First request fails
      const response1 = await request(app)
        .get('/api/v1/pincode/999999/location');

      expect([200, 503]).toContain(response1.status);

      // Second request should try API again
      const response2 = await request(app)
        .get('/api/v1/pincode/999999/location');

      expect([200, 503]).toContain(response2.status);

      // API should be called twice (no caching of failures)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should respect cache TTL', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Test Office',
            District: 'Test District',
            State: 'Test State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Make initial request
      await request(app)
        .get('/api/v1/pincode/110001/location');

      // Manually expire the cache entry
      const cacheEntry = LocationService.cache.get('110001');
      if (cacheEntry) {
        cacheEntry.timestamp = Date.now() - (LocationService.CACHE_TTL + 1000);
      }

      // Next request should call API again
      await request(app)
        .get('/api/v1/pincode/110001/location');

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Error Recovery', () => {
    it('should recover from temporary API failures', async () => {
      // Simulate temporary failure followed by success
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          data: [{
            Status: 'Success',
            PostOffice: [{
              Name: 'Recovery Office',
              District: 'Recovery District',
              State: 'Recovery State',
              Country: 'India'
            }]
          }]
        });

      const response = await request(app)
        .get('/api/v1/pincode/400001/location');

      expect(response.status).toBe(200);
      expect(response.body.data.city).toBe('Recovery District');
    });

    it('should handle partial API responses', async () => {
      const partialResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Partial Office',
            District: 'Partial District',
            // Missing State and Country
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(partialResponse);

      const response = await request(app)
        .get('/api/v1/pincode/123456/location');

      expect(response.status).toBe(200);
      expect(response.body.data.city).toBe('Partial District');
      expect(response.body.data.state).toBeDefined(); // Should have default or fallback
    });
  });

  describe('Concurrent API Requests', () => {
    it('should handle concurrent requests to same PIN code efficiently', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Concurrent Office',
            District: 'Concurrent District',
            State: 'Concurrent State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Make 10 concurrent requests for the same PIN code
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/v1/pincode/110001/location')
        );
      }

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.city).toBe('Concurrent District');
      });

      // API should only be called once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests to different PIN codes', async () => {
      const mockResponses = {
        '110001': {
          data: [{
            Status: 'Success',
            PostOffice: [{
              Name: 'Delhi Office',
              District: 'Central Delhi',
              State: 'Delhi',
              Country: 'India'
            }]
          }]
        },
        '400001': {
          data: [{
            Status: 'Success',
            PostOffice: [{
              Name: 'Mumbai Office',
              District: 'Mumbai',
              State: 'Maharashtra',
              Country: 'India'
            }]
          }]
        }
      };

      mockedAxios.get.mockImplementation((url) => {
        const pincode = url.split('/').pop();
        return Promise.resolve(mockResponses[pincode] || { data: [] });
      });

      const requests = [
        request(app).get('/api/v1/pincode/110001/location'),
        request(app).get('/api/v1/pincode/400001/location'),
        request(app).get('/api/v1/pincode/110001/location'), // Duplicate
        request(app).get('/api/v1/pincode/400001/location')  // Duplicate
      ];

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should have called API for each unique PIN code
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Response Validation', () => {
    it('should validate API response structure', async () => {
      const validResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Valid Office',
            District: 'Valid District',
            State: 'Valid State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(validResponse);

      const response = await request(app)
        .get('/api/v1/pincode/110001/location');

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        pincode: '110001',
        city: expect.any(String),
        state: expect.any(String),
        district: expect.any(String),
        country: expect.any(String)
      });
    });

    it('should handle malformed JSON responses', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unexpected token in JSON'));

      const response = await request(app)
        .get('/api/v1/pincode/123456/location');

      expect([200, 503]).toContain(response.status);
    });

    it('should sanitize API response data', async () => {
      const maliciousResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: '<script>alert("xss")</script>Office',
            District: 'Normal District',
            State: 'Normal State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(maliciousResponse);

      const response = await request(app)
        .get('/api/v1/pincode/110001/location');

      expect(response.status).toBe(200);
      // Response should not contain script tags
      expect(JSON.stringify(response.body)).not.toContain('<script>');
    });
  });

  describe('API Performance Monitoring', () => {
    it('should track API response times', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Performance Office',
            District: 'Performance District',
            State: 'Performance State',
            Country: 'India'
          }]
        }]
      };

      // Simulate slow API response
      mockedAxios.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(mockResponse), 100)
        )
      );

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/pincode/110001/location');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeGreaterThan(100);
      expect(response.body.metadata.timestamp).toBeDefined();
    });

    it('should handle API timeout configuration', async () => {
      // Mock a very slow response
      mockedAxios.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: [] }), 10000)
        )
      );

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/pincode/123456/location');
      const endTime = Date.now();

      // Should timeout before 10 seconds
      expect(endTime - startTime).toBeLessThan(8000);
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('Fallback Data Handling', () => {
    it('should use static fallback data for known PIN codes', async () => {
      // Mock all APIs to fail
      mockedAxios.get.mockRejectedValue(new Error('All APIs failed'));

      const knownPinCodes = ['110001', '400001', '560001', '600001', '700001'];

      for (const pincode of knownPinCodes) {
        const response = await request(app)
          .get(`/api/v1/pincode/${pincode}/location`);

        expect(response.status).toBe(200);
        expect(response.body.data.pincode).toBe(pincode);
        expect(response.body.data.city).toBeTruthy();
        expect(response.body.data.state).toBeTruthy();
      }
    });

    it('should return service unavailable for unknown PIN codes when APIs fail', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API failed'));

      const response = await request(app)
        .get('/api/v1/pincode/999999/location');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Unable to fetch location data');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      // Add some cached data
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Cache Office',
            District: 'Cache District',
            State: 'Cache State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Make some requests to populate cache
      await request(app).get('/api/v1/pincode/110001/location');
      await request(app).get('/api/v1/pincode/400001/location');

      // Get cache stats
      const response = await request(app)
        .get('/api/v1/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.location_cache).toMatchObject({
        totalEntries: expect.any(Number),
        validEntries: expect.any(Number),
        expiredEntries: expect.any(Number),
        cacheHitRate: expect.any(Number)
      });
    });

    it('should clear expired cache entries', async () => {
      // Add some data to cache
      LocationService.setCachedLocation('110001', {
        city: 'Test City',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '110001'
      });

      // Add expired entry
      LocationService.cache.set('400001', {
        data: { city: 'Expired' },
        timestamp: Date.now() - (LocationService.CACHE_TTL + 1000)
      });

      const response = await request(app)
        .post('/api/v1/cache/clear');

      expect(response.status).toBe(200);
      expect(response.body.data.entriesCleared).toBeGreaterThan(0);
    });
  });
});
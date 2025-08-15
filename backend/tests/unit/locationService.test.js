/**
 * @fileoverview Unit tests for LocationService
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const LocationService = require('../../src/services/locationService');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('LocationService', () => {
  beforeEach(() => {
    // Clear cache before each test
    LocationService.cache.clear();
    jest.clearAllMocks();
    
    // Setup axios mock methods
    mockedAxios.get = jest.fn();
  });

  describe('validatePincode', () => {
    it('should validate correct PIN code format', () => {
      expect(LocationService.validatePincode('123456')).toBe(true);
      expect(LocationService.validatePincode('000000')).toBe(true);
      expect(LocationService.validatePincode('999999')).toBe(true);
    });

    it('should reject invalid PIN code formats', () => {
      expect(LocationService.validatePincode('12345')).toBe(false);
      expect(LocationService.validatePincode('1234567')).toBe(false);
      expect(LocationService.validatePincode('abcdef')).toBe(false);
      expect(LocationService.validatePincode('12345a')).toBe(false);
      expect(LocationService.validatePincode('')).toBe(false);
    });
  });

  describe('getCachedLocation', () => {
    it('should return null for non-existent cache entry', () => {
      const result = LocationService.getCachedLocation('123456');
      expect(result).toBeNull();
    });

    it('should return cached data for valid entry', () => {
      const testData = {
        city: 'Test City',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      };

      LocationService.setCachedLocation('123456', testData);
      const result = LocationService.getCachedLocation('123456');
      
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache entry', () => {
      const testData = {
        city: 'Test City',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      };

      // Manually set expired cache entry
      LocationService.cache.set('123456', {
        data: testData,
        timestamp: Date.now() - (LocationService.CACHE_TTL + 1000)
      });

      const result = LocationService.getCachedLocation('123456');
      expect(result).toBeNull();
      expect(LocationService.cache.has('123456')).toBe(false);
    });
  });

  describe('setCachedLocation', () => {
    it('should cache location data with timestamp', () => {
      const testData = {
        city: 'Test City',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      };

      LocationService.setCachedLocation('123456', testData);
      
      expect(LocationService.cache.has('123456')).toBe(true);
      const cached = LocationService.cache.get('123456');
      expect(cached.data).toEqual(testData);
      expect(cached.timestamp).toBeCloseTo(Date.now(), -2);
    });
  });

  describe('fetchFromPostPin', () => {
    it('should fetch location data from PostPin API', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Test Post Office',
            District: 'Test District',
            State: 'Test State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await LocationService.fetchFromPostPin('123456');

      expect(result).toEqual({
        city: 'Test District',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/postoffice/123456',
        LocationService.POSTPIN_CONFIG
      );
    });

    it('should handle PostPin API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(LocationService.fetchFromPostPin('123456'))
        .rejects.toThrow('Network error');
    });

    it('should handle empty PostPin API response', async () => {
      const mockResponse = {
        data: [{
          Status: 'Error',
          PostOffice: []
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(LocationService.fetchFromPostPin('123456'))
        .rejects.toThrow('No data found in PostPin API response');
    });
  });

  describe('fetchFromIndiaPost', () => {
    it('should fetch location data from India Post API', async () => {
      const mockResponse = {
        data: {
          records: [{
            officename: 'Test Office',
            districtname: 'Test District',
            statename: 'Test State'
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await LocationService.fetchFromIndiaPost('123456');

      expect(result).toEqual({
        city: 'Test District',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      });
    });

    it('should handle India Post API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));

      await expect(LocationService.fetchFromIndiaPost('123456'))
        .rejects.toThrow('API error');
    });
  });

  describe('getFallbackLocation', () => {
    it('should return fallback data for known PIN codes', () => {
      const result = LocationService.getFallbackLocation('110001');
      
      expect(result).toEqual({
        city: 'New Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        country: 'India',
        pincode: '110001'
      });
    });

    it('should return null for unknown PIN codes', () => {
      const result = LocationService.getFallbackLocation('999999');
      expect(result).toBeNull();
    });
  });

  describe('getLocationByPincode', () => {
    it('should validate PIN code format', async () => {
      await expect(LocationService.getLocationByPincode('12345'))
        .rejects.toThrow('Invalid PIN code format');
    });

    it('should return cached data if available', async () => {
      const testData = {
        city: 'Cached City',
        state: 'Cached State',
        district: 'Cached District',
        country: 'India',
        pincode: '123456'
      };

      LocationService.setCachedLocation('123456', testData);

      const result = await LocationService.getLocationByPincode('123456');
      expect(result).toEqual(testData);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from PostPin API when not cached', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'API Post Office',
            District: 'API District',
            State: 'API State',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await LocationService.getLocationByPincode('123456');

      expect(result).toEqual({
        city: 'API District',
        state: 'API State',
        district: 'API District',
        country: 'India',
        pincode: '123456'
      });

      expect(LocationService.getCachedLocation('123456')).toEqual(result);
    });

    it('should fallback to India Post API when PostPin fails', async () => {
      // Mock PostPin to fail
      mockedAxios.get
        .mockRejectedValueOnce(new Error('PostPin failed'))
        .mockResolvedValueOnce({
          data: {
            records: [{
              officename: 'Fallback Office',
              districtname: 'Fallback District',
              statename: 'Fallback State'
            }]
          }
        });

      const result = await LocationService.getLocationByPincode('123456');

      expect(result).toEqual({
        city: 'Fallback District',
        state: 'Fallback State',
        district: 'Fallback District',
        country: 'India',
        pincode: '123456'
      });
    });

    it('should use static fallback when all APIs fail', async () => {
      // Mock both APIs to fail
      mockedAxios.get.mockRejectedValue(new Error('API failed'));

      const result = await LocationService.getLocationByPincode('110001');

      expect(result).toEqual({
        city: 'New Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        country: 'India',
        pincode: '110001'
      });
    });

    it('should throw error when all methods fail', async () => {
      // Mock APIs to fail and use unknown PIN code
      mockedAxios.get.mockRejectedValue(new Error('API failed'));

      await expect(LocationService.getLocationByPincode('999999'))
        .rejects.toThrow('Unable to fetch location data');
    });
  });

  describe('validatePincodeExists', () => {
    it('should return true for valid PIN code', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Test Office',
            District: 'Test District',
            State: 'Test State'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await LocationService.validatePincodeExists('123456');
      expect(result).toBe(true);
    });

    it('should return false for invalid PIN code format', async () => {
      const result = await LocationService.validatePincodeExists('12345');
      expect(result).toBe(false);
    });

    it('should return true for service unavailable (assume valid)', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Service unavailable'));

      const result = await LocationService.validatePincodeExists('999999');
      expect(result).toBe(true);
    });
  });

  describe('clearExpiredCache', () => {
    it('should clear expired cache entries', () => {
      const validData = { city: 'Valid', state: 'Valid', district: 'Valid', country: 'India', pincode: '123456' };
      const expiredData = { city: 'Expired', state: 'Expired', district: 'Expired', country: 'India', pincode: '654321' };

      // Add valid entry
      LocationService.setCachedLocation('123456', validData);

      // Add expired entry
      LocationService.cache.set('654321', {
        data: expiredData,
        timestamp: Date.now() - (LocationService.CACHE_TTL + 1000)
      });

      expect(LocationService.cache.size).toBe(2);

      LocationService.clearExpiredCache();

      expect(LocationService.cache.size).toBe(1);
      expect(LocationService.cache.has('123456')).toBe(true);
      expect(LocationService.cache.has('654321')).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', () => {
      const validData = { city: 'Valid', state: 'Valid', district: 'Valid', country: 'India', pincode: '123456' };
      const expiredData = { city: 'Expired', state: 'Expired', district: 'Expired', country: 'India', pincode: '654321' };

      // Add valid entry
      LocationService.setCachedLocation('123456', validData);

      // Add expired entry
      LocationService.cache.set('654321', {
        data: expiredData,
        timestamp: Date.now() - (LocationService.CACHE_TTL + 1000)
      });

      const stats = LocationService.getCacheStats();

      expect(stats).toEqual({
        totalEntries: 2,
        validEntries: 1,
        expiredEntries: 1,
        cacheHitRate: 0.5
      });
    });

    it('should handle empty cache', () => {
      const stats = LocationService.getCacheStats();

      expect(stats).toEqual({
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        cacheHitRate: 0
      });
    });
  });
});
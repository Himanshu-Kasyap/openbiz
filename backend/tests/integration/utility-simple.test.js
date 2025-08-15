/**
 * @fileoverview Simple integration tests for utility services
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const LocationService = require('../../src/services/locationService');
const FormSchemaService = require('../../src/services/formSchemaService');
const axios = require('axios');

// Mock axios for external API calls
jest.mock('axios');
const mockedAxios = axios;

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    formSchema: {
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn(),
      create: jest.fn()
    }
  }
}));

describe('Utility Services Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    LocationService.cache.clear();
    
    // Setup axios mock methods
    mockedAxios.get = jest.fn();
  });

  describe('LocationService Integration', () => {
    it('should handle complete PIN code lookup flow', async () => {
      // Mock successful PostPin API response
      mockedAxios.get.mockResolvedValue({
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Test Post Office',
            District: 'Test District',
            State: 'Test State',
            Country: 'India'
          }]
        }]
      });

      const result = await LocationService.getLocationByPincode('123456');

      expect(result).toEqual({
        city: 'Test District',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      });

      // Verify caching works
      const cachedResult = await LocationService.getLocationByPincode('123456');
      expect(cachedResult).toEqual(result);
      
      // Should only call API once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fallback gracefully when APIs fail', async () => {
      // Mock API failure
      mockedAxios.get.mockRejectedValue(new Error('API failed'));

      // Should use fallback data for known PIN codes
      const result = await LocationService.getLocationByPincode('110001');

      expect(result).toEqual({
        city: 'New Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        country: 'India',
        pincode: '110001'
      });
    });

    it('should validate PIN code format', async () => {
      await expect(LocationService.getLocationByPincode('12345'))
        .rejects.toThrow('Invalid PIN code format');

      await expect(LocationService.getLocationByPincode('abcdef'))
        .rejects.toThrow('Invalid PIN code format');
    });

    it('should manage cache correctly', () => {
      const testData = {
        city: 'Test City',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      };

      // Test caching
      LocationService.setCachedLocation('123456', testData);
      expect(LocationService.getCachedLocation('123456')).toEqual(testData);

      // Test cache stats
      const stats = LocationService.getCacheStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.validEntries).toBe(1);
    });
  });

  describe('FormSchemaService Integration', () => {
    it('should return default schema when no database schema exists', async () => {
      const schema = await FormSchemaService.getFormSchema();

      expect(schema).toHaveProperty('version');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('steps');
      expect(schema.steps).toHaveLength(2);

      // Verify step 1 has required fields
      const step1 = schema.steps.find(s => s.stepNumber === 1);
      expect(step1).toBeDefined();
      expect(step1.fields.some(f => f.name === 'aadhaarNumber')).toBe(true);
      expect(step1.fields.some(f => f.name === 'otp')).toBe(true);

      // Verify step 2 has required fields
      const step2 = schema.steps.find(s => s.stepNumber === 2);
      expect(step2).toBeDefined();
      expect(step2.fields.some(f => f.name === 'panNumber')).toBe(true);
    });

    it('should validate form data correctly', async () => {
      // Valid step 1 data
      const validStep1Data = {
        aadhaarNumber: '123456789012',
        otp: '123456'
      };

      const result1 = await FormSchemaService.validateFormData(validStep1Data, 1);
      expect(result1.isValid).toBe(true);
      expect(result1.errors).toEqual([]);

      // Invalid step 1 data
      const invalidStep1Data = {
        aadhaarNumber: '12345', // Too short
        otp: '' // Required but empty
      };

      const result2 = await FormSchemaService.validateFormData(invalidStep1Data, 1);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.length).toBeGreaterThan(0);
    });

    it('should get step schemas correctly', async () => {
      const step1 = await FormSchemaService.getStepSchema(1);
      expect(step1.stepNumber).toBe(1);
      expect(step1.title).toBe('Aadhaar Verification');

      const step2 = await FormSchemaService.getStepSchema(2);
      expect(step2.stepNumber).toBe(2);
      expect(step2.title).toBe('PAN & Personal Details');

      await expect(FormSchemaService.getStepSchema(3))
        .rejects.toThrow('Step number must be 1 or 2');
    });

    it('should get field validation rules', async () => {
      const aadhaarRules = await FormSchemaService.getFieldValidationRules('aadhaarNumber');
      expect(aadhaarRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'required' }),
          expect.objectContaining({ type: 'pattern' })
        ])
      );

      await expect(FormSchemaService.getFieldValidationRules('nonExistentField'))
        .rejects.toThrow('not found in form schema');
    });

    it('should handle nested object values', () => {
      const obj = {};
      FormSchemaService.setNestedValue(obj, 'personalDetails.address.city', 'Test City');
      
      expect(obj).toEqual({
        personalDetails: {
          address: {
            city: 'Test City'
          }
        }
      });

      const value = FormSchemaService.getNestedValue(obj, 'personalDetails.address.city');
      expect(value).toBe('Test City');
    });
  });

  describe('External API Integration', () => {
    it('should handle PostPin API response format', async () => {
      const mockResponse = {
        data: [{
          Status: 'Success',
          PostOffice: [{
            Name: 'Connaught Place',
            District: 'New Delhi',
            State: 'Delhi',
            Country: 'India'
          }]
        }]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await LocationService.fetchFromPostPin('110001');
      
      expect(result).toEqual({
        city: 'New Delhi',
        state: 'Delhi',
        district: 'New Delhi',
        country: 'India',
        pincode: '110001'
      });
    });

    it('should handle India Post API response format', async () => {
      const mockResponse = {
        data: {
          records: [{
            officename: 'Mumbai GPO',
            districtname: 'Mumbai City',
            statename: 'Maharashtra'
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await LocationService.fetchFromIndiaPost('400001');
      
      expect(result).toEqual({
        city: 'Mumbai City',
        state: 'Maharashtra',
        district: 'Mumbai City',
        country: 'India',
        pincode: '400001'
      });
    });

    it('should handle API timeouts and errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(LocationService.fetchFromPostPin('123456'))
        .rejects.toThrow('ETIMEDOUT');

      await expect(LocationService.fetchFromIndiaPost('123456'))
        .rejects.toThrow('ETIMEDOUT');
    });
  });

  describe('Caching Strategy', () => {
    it('should implement TTL correctly', () => {
      const testData = {
        city: 'Test City',
        state: 'Test State',
        district: 'Test District',
        country: 'India',
        pincode: '123456'
      };

      // Add valid entry
      LocationService.setCachedLocation('123456', testData);
      expect(LocationService.getCachedLocation('123456')).toEqual(testData);

      // Manually expire entry
      LocationService.cache.set('123456', {
        data: testData,
        timestamp: Date.now() - (LocationService.CACHE_TTL + 1000)
      });

      // Should return null for expired entry
      expect(LocationService.getCachedLocation('123456')).toBeNull();
    });

    it('should clear expired entries', () => {
      const validData = { city: 'Valid', state: 'Valid', district: 'Valid', country: 'India', pincode: '111111' };
      const expiredData = { city: 'Expired', state: 'Expired', district: 'Expired', country: 'India', pincode: '222222' };

      // Add valid entry
      LocationService.setCachedLocation('111111', validData);

      // Add expired entry
      LocationService.cache.set('222222', {
        data: expiredData,
        timestamp: Date.now() - (LocationService.CACHE_TTL + 1000)
      });

      expect(LocationService.cache.size).toBe(2);

      LocationService.clearExpiredCache();

      expect(LocationService.cache.size).toBe(1);
      expect(LocationService.cache.has('111111')).toBe(true);
      expect(LocationService.cache.has('222222')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors appropriately', async () => {
      // Invalid PIN code format
      await expect(LocationService.getLocationByPincode(''))
        .rejects.toThrow('Invalid PIN code format');

      // Invalid step number
      await expect(FormSchemaService.getStepSchema(0))
        .rejects.toThrow('Step number must be 1 or 2');
    });

    it('should handle service unavailable scenarios', async () => {
      // Mock all APIs to fail
      mockedAxios.get.mockRejectedValue(new Error('Service unavailable'));

      // Should throw error for unknown PIN codes when all services fail
      await expect(LocationService.getLocationByPincode('999999'))
        .rejects.toThrow('Unable to fetch location data');
    });
  });
});
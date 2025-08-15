/**
 * @fileoverview Location service for PIN code to location mapping
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const axios = require('axios');
const logger = require('../config/logger');
const { AppError, ValidationError } = require('../middleware/errorHandler');

/**
 * @typedef {Object} LocationData
 * @property {string} city - City name
 * @property {string} state - State name
 * @property {string} district - District name
 * @property {string} country - Country name
 * @property {string} pincode - PIN code
 */

/**
 * Location service class for PIN code lookups
 */
class LocationService {
  /**
   * In-memory cache for PIN code data (24-hour TTL)
   * @type {Map<string, {data: LocationData, timestamp: number}>}
   */
  static cache = new Map();

  /**
   * Cache TTL in milliseconds (24 hours)
   * @type {number}
   */
  static CACHE_TTL = 24 * 60 * 60 * 1000;

  /**
   * PostPin API configuration
   * @type {Object}
   */
  static POSTPIN_CONFIG = {
    baseURL: 'https://api.postalpincode.in',
    timeout: 5000,
    headers: {
      'User-Agent': 'Udyam-Registration-Replica/1.0.0'
    }
  };

  /**
   * India Post API configuration (fallback)
   * @type {Object}
   */
  static INDIAPOST_CONFIG = {
    baseURL: 'https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6',
    timeout: 5000,
    headers: {
      'User-Agent': 'Udyam-Registration-Replica/1.0.0'
    }
  };

  /**
   * Validate PIN code format
   * @param {string} pincode - PIN code to validate
   * @returns {boolean}
   */
  static validatePincode(pincode) {
    const pincodePattern = /^\d{6}$/;
    return pincodePattern.test(pincode);
  }

  /**
   * Get cached location data
   * @param {string} pincode - PIN code
   * @returns {LocationData|null}
   */
  static getCachedLocation(pincode) {
    const cached = this.cache.get(pincode);
    
    if (!cached) {
      return null;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(pincode);
      return null;
    }

    logger.debug('Cache hit for PIN code', { pincode });
    return cached.data;
  }

  /**
   * Cache location data
   * @param {string} pincode - PIN code
   * @param {LocationData} data - Location data to cache
   */
  static setCachedLocation(pincode, data) {
    this.cache.set(pincode, {
      data,
      timestamp: Date.now()
    });
    
    logger.debug('Cached location data for PIN code', { pincode });
  }

  /**
   * Fetch location from PostPin API (primary)
   * @param {string} pincode - PIN code
   * @returns {Promise<LocationData>}
   */
  static async fetchFromPostPin(pincode) {
    try {
      const response = await axios.get(
        `/postoffice/${pincode}`,
        this.POSTPIN_CONFIG
      );

      if (response.data && response.data[0] && response.data[0].Status === 'Success') {
        const postOffices = response.data[0].PostOffice;
        
        if (postOffices && postOffices.length > 0) {
          const firstOffice = postOffices[0];
          
          return {
            city: firstOffice.District || firstOffice.Name,
            state: firstOffice.State,
            district: firstOffice.District,
            country: firstOffice.Country || 'India',
            pincode: pincode
          };
        }
      }

      throw new Error('No data found in PostPin API response');
    } catch (error) {
      logger.warn('PostPin API request failed', {
        pincode,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Fetch location from India Post API (fallback)
   * @param {string} pincode - PIN code
   * @returns {Promise<LocationData>}
   */
  static async fetchFromIndiaPost(pincode) {
    try {
      const response = await axios.get('', {
        ...this.INDIAPOST_CONFIG,
        params: {
          'api-key': process.env.INDIA_POST_API_KEY || 'demo-key',
          'format': 'json',
          'filters[pincode]': pincode,
          'limit': 1
        }
      });

      if (response.data && response.data.records && response.data.records.length > 0) {
        const record = response.data.records[0];
        
        return {
          city: record.districtname || record.officename,
          state: record.statename,
          district: record.districtname,
          country: 'India',
          pincode: pincode
        };
      }

      throw new Error('No data found in India Post API response');
    } catch (error) {
      logger.warn('India Post API request failed', {
        pincode,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get fallback location data for common PIN codes
   * @param {string} pincode - PIN code
   * @returns {LocationData|null}
   */
  static getFallbackLocation(pincode) {
    // Common PIN codes for major cities (fallback data)
    const fallbackData = {
      '110001': { city: 'New Delhi', state: 'Delhi', district: 'Central Delhi', country: 'India' },
      '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City', country: 'India' },
      '560001': { city: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban', country: 'India' },
      '600001': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', country: 'India' },
      '700001': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata', country: 'India' },
      '500001': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', country: 'India' },
      '411001': { city: 'Pune', state: 'Maharashtra', district: 'Pune', country: 'India' },
      '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', country: 'India' }
    };

    const fallback = fallbackData[pincode];
    if (fallback) {
      return { ...fallback, pincode };
    }

    return null;
  }

  /**
   * Get location by PIN code with caching and fallback
   * @param {string} pincode - PIN code
   * @returns {Promise<LocationData>}
   */
  static async getLocationByPincode(pincode) {
    // Validate PIN code format
    if (!this.validatePincode(pincode)) {
      throw new ValidationError('Invalid PIN code format. PIN code must be exactly 6 digits.');
    }

    // Check cache first
    const cached = this.getCachedLocation(pincode);
    if (cached) {
      return cached;
    }

    let locationData = null;
    let lastError = null;

    // Try PostPin API (primary)
    try {
      locationData = await this.fetchFromPostPin(pincode);
      this.setCachedLocation(pincode, locationData);
      
      logger.info('Location fetched from PostPin API', { pincode });
      return locationData;
    } catch (error) {
      lastError = error;
      logger.warn('PostPin API failed, trying fallback', { pincode, error: error.message });
    }

    // Try India Post API (fallback)
    try {
      locationData = await this.fetchFromIndiaPost(pincode);
      this.setCachedLocation(pincode, locationData);
      
      logger.info('Location fetched from India Post API', { pincode });
      return locationData;
    } catch (error) {
      lastError = error;
      logger.warn('India Post API failed, trying static fallback', { pincode, error: error.message });
    }

    // Try static fallback data
    locationData = this.getFallbackLocation(pincode);
    if (locationData) {
      this.setCachedLocation(pincode, locationData);
      
      logger.info('Location fetched from static fallback', { pincode });
      return locationData;
    }

    // All methods failed
    logger.error('All location lookup methods failed', { 
      pincode, 
      lastError: lastError?.message 
    });
    
    throw new AppError(
      'Unable to fetch location data for the provided PIN code. Please enter city and state manually.',
      503,
      'LOCATION_SERVICE_UNAVAILABLE'
    );
  }

  /**
   * Validate PIN code existence (lightweight check)
   * @param {string} pincode - PIN code to validate
   * @returns {Promise<boolean>}
   */
  static async validatePincodeExists(pincode) {
    try {
      await this.getLocationByPincode(pincode);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        return false;
      }
      // For service unavailable errors, assume PIN code might be valid
      return true;
    }
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache() {
    const now = Date.now();
    let clearedCount = 0;

    for (const [pincode, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(pincode);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      logger.info('Cleared expired cache entries', { count: clearedCount });
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  static getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const cached of this.cache.values()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheHitRate: validEntries / Math.max(this.cache.size, 1)
    };
  }
}

// Set up periodic cache cleanup (every hour) - only in production
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    LocationService.clearExpiredCache();
  }, 60 * 60 * 1000);
}

module.exports = LocationService;
/**
 * @fileoverview Location API service for PIN code lookup and auto-fill
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import api from './api'

/**
 * @typedef {Object} LocationData
 * @property {string} pincode
 * @property {string} city
 * @property {string} state
 * @property {string} district
 * @property {string} country
 */

/**
 * @typedef {Object} LocationResponse
 * @property {boolean} success
 * @property {LocationData} data
 * @property {Object} metadata
 * @property {string} metadata.source
 * @property {string} metadata.timestamp
 * @property {boolean} metadata.cached
 */

/**
 * @typedef {Object} FormSchemaResponse
 * @property {boolean} success
 * @property {Object} data
 * @property {string} data.version
 * @property {string} data.title
 * @property {Array} data.steps
 */

/**
 * Location API service
 */
const locationApi = {
  /**
   * Get location details by PIN code
   * @param {string} pincode - 6-digit PIN code
   * @returns {Promise<LocationData>}
   */
  async getLocationByPincode(pincode) {
    // Validate PIN code format
    if (!/^\d{6}$/.test(pincode)) {
      throw new Error('Invalid PIN code format. Must be 6 digits.')
    }

    const response = await api.get(`/pincode/${pincode}/location`)
    return response.data
  },

  /**
   * Get complete form schema
   * @returns {Promise<Object>}
   */
  async getFormSchema() {
    const response = await api.get('/form-schema')
    return response.data
  },

  /**
   * Get form schema for specific step
   * @param {number} stepNumber - Step number (1 or 2)
   * @returns {Promise<Object>}
   */
  async getStepSchema(stepNumber) {
    const response = await api.get(`/form-schema/step/${stepNumber}`)
    return response.data
  },

  /**
   * Get form schema metadata
   * @returns {Promise<Object>}
   */
  async getSchemaMetadata() {
    const response = await api.get('/form-schema/metadata')
    return response.data
  },

  /**
   * Get cache statistics
   * @returns {Promise<Object>}
   */
  async getCacheStats() {
    const response = await api.get('/cache/stats')
    return response.data
  }
}

/**
 * In-memory cache for location data to reduce API calls
 */
class LocationCache {
  constructor() {
    this.cache = new Map()
    this.ttl = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  }

  /**
   * Get cached location data
   * @param {string} pincode
   * @returns {LocationData|null}
   */
  get(pincode) {
    const cached = this.cache.get(pincode)
    if (!cached) return null

    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(pincode)
      return null
    }

    return cached.data
  }

  /**
   * Set location data in cache
   * @param {string} pincode
   * @param {LocationData} data
   */
  set(pincode, data) {
    this.cache.set(pincode, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    const now = Date.now()
    for (const [pincode, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttl) {
        this.cache.delete(pincode)
      }
    }
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
  }
}

// Create global cache instance
const locationCache = new LocationCache()

/**
 * Enhanced location API with caching
 */
const cachedLocationApi = {
  ...locationApi,

  /**
   * Get location by PIN code with caching
   * @param {string} pincode
   * @returns {Promise<LocationData>}
   */
  async getLocationByPincode(pincode) {
    // Check cache first
    const cached = locationCache.get(pincode)
    if (cached) {
      return cached
    }

    try {
      // Fetch from API
      const data = await locationApi.getLocationByPincode(pincode)
      
      // Cache the result
      locationCache.set(pincode, data)
      
      return data
    } catch (error) {
      // If API fails, try to return stale cache data
      const staleData = locationCache.cache.get(pincode)
      if (staleData) {
        console.warn(`Using stale cache data for PIN code ${pincode}`)
        return staleData.data
      }
      
      throw error
    }
  },

  /**
   * Preload location data for common PIN codes
   * @param {string[]} pincodes
   * @returns {Promise<void>}
   */
  async preloadLocations(pincodes) {
    const promises = pincodes.map(async (pincode) => {
      try {
        await this.getLocationByPincode(pincode)
      } catch (error) {
        console.warn(`Failed to preload location for PIN code ${pincode}:`, error)
      }
    })

    await Promise.allSettled(promises)
  },

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheInfo() {
    return {
      size: locationCache.size(),
      ttlHours: locationCache.ttl / (1000 * 60 * 60)
    }
  },

  /**
   * Clear location cache
   */
  clearCache() {
    locationCache.clear()
  }
}

export { locationApi, cachedLocationApi, LocationCache }
export default cachedLocationApi
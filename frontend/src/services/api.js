/**
 * @fileoverview API client service with error handling and retry logic
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {any} data
 * @property {Object} [error]
 * @property {string} [error.code]
 * @property {string} [error.message]
 * @property {any} [error.details]
 */

/**
 * @typedef {Object} ApiClientConfig
 * @property {string} baseURL
 * @property {number} timeout
 * @property {number} maxRetries
 * @property {number} retryDelay
 */

/**
 * API client configuration
 * @type {ApiClientConfig}
 */
const config = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000 // 1 second
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {string} code
   * @param {any} details
   */
  constructor(message, status, code, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if error is retryable
 * @param {Error} error
 * @returns {boolean}
 */
const isRetryableError = (error) => {
  if (error instanceof ApiError) {
    // Retry on server errors (5xx) and some client errors
    return error.status >= 500 || error.status === 408 || error.status === 429
  }
  
  // Retry on network errors
  return error.name === 'TypeError' || error.message.includes('fetch')
}

/**
 * Make HTTP request with retry logic
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
const fetchWithRetry = async (url, options = {}) => {
  let lastError
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      lastError = error
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        break
      }
      
      // Wait before retrying with exponential backoff
      const delay = config.retryDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }
  
  throw lastError
}

/**
 * Process API response
 * @param {Response} response
 * @returns {Promise<any>}
 */
const processResponse = async (response) => {
  const contentType = response.headers.get('content-type')
  
  let data
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }
  
  if (!response.ok) {
    const error = data?.error || {}
    throw new ApiError(
      error.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      error.code || 'HTTP_ERROR',
      error.details || data
    )
  }
  
  return data
}

/**
 * Make API request
 * @param {string} endpoint
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
const request = async (endpoint, options = {}) => {
  const url = `${config.baseURL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }
  
  const requestOptions = {
    ...defaultOptions,
    ...options
  }
  
  // Add request body for POST/PUT requests
  if (requestOptions.body && typeof requestOptions.body === 'object') {
    requestOptions.body = JSON.stringify(requestOptions.body)
  }
  
  try {
    const response = await fetchWithRetry(url, requestOptions)
    return await processResponse(response)
  } catch (error) {
    // Log error for debugging
    console.error(`API request failed: ${requestOptions.method || 'GET'} ${url}`, error)
    throw error
  }
}

/**
 * API client methods
 */
const api = {
  /**
   * GET request
   * @param {string} endpoint
   * @param {RequestInit} options
   * @returns {Promise<any>}
   */
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  
  /**
   * POST request
   * @param {string} endpoint
   * @param {any} data
   * @param {RequestInit} options
   * @returns {Promise<any>}
   */
  post: (endpoint, data, options = {}) => request(endpoint, {
    ...options,
    method: 'POST',
    body: data
  }),
  
  /**
   * PUT request
   * @param {string} endpoint
   * @param {any} data
   * @param {RequestInit} options
   * @returns {Promise<any>}
   */
  put: (endpoint, data, options = {}) => request(endpoint, {
    ...options,
    method: 'PUT',
    body: data
  }),
  
  /**
   * DELETE request
   * @param {string} endpoint
   * @param {RequestInit} options
   * @returns {Promise<any>}
   */
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' })
}

export { api, ApiError, config }
export default api
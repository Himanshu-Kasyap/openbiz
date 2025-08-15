/**
 * @fileoverview Enhanced error handling hook with retry logic and user feedback
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { ApiError } from '../services/api'

/**
 * @typedef {Object} ErrorState
 * @property {Error|null} error - Current error
 * @property {boolean} isLoading - Loading state
 * @property {number} retryCount - Number of retry attempts
 * @property {boolean} canRetry - Whether retry is possible
 * @property {string|null} userMessage - User-friendly error message
 * @property {string|null} errorCode - Error code for categorization
 */

/**
 * @typedef {Object} ErrorHandlerOptions
 * @property {number} [maxRetries=3] - Maximum retry attempts
 * @property {number} [retryDelay=1000] - Initial retry delay in ms
 * @property {number} [retryBackoff=2] - Retry backoff multiplier
 * @property {boolean} [showUserMessage=true] - Whether to generate user messages
 * @property {function(Error): boolean} [shouldRetry] - Custom retry logic
 * @property {function(Error): string} [getErrorMessage] - Custom error message generator
 * @property {function(Error, number): void} [onRetry] - Retry callback
 * @property {function(Error): void} [onError] - Error callback
 */

/**
 * Enhanced error handling hook
 * @param {ErrorHandlerOptions} options - Error handler options
 * @returns {Object} Error handling state and functions
 */
const useErrorHandler = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryBackoff = 2,
    showUserMessage = true,
    shouldRetry,
    getErrorMessage,
    onRetry,
    onError
  } = options

  const [errorState, setErrorState] = useState({
    error: null,
    isLoading: false,
    retryCount: 0,
    canRetry: false,
    userMessage: null,
    errorCode: null
  })

  const retryTimeoutRef = useRef(null)

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} User-friendly message
   */
  const getUserMessage = useCallback((error) => {
    if (getErrorMessage) {
      return getErrorMessage(error)
    }

    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return 'Please check your information and try again.'
        case 401:
          return 'Your session has expired. Please refresh the page.'
        case 403:
          return 'You don\'t have permission to perform this action.'
        case 404:
          return 'The requested information was not found.'
        case 408:
          return 'Request timed out. Please try again.'
        case 429:
          return 'Too many requests. Please wait a moment and try again.'
        case 500:
          return 'Server error. Please try again in a moment.'
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.'
        default:
          return error.message || 'An unexpected error occurred.'
      }
    }

    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.'
    }

    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please try again.'
    }

    return error.message || 'An unexpected error occurred.'
  }, [getErrorMessage])

  /**
   * Get error code for categorization
   * @param {Error} error - Error object
   * @returns {string} Error code
   */
  const getErrorCode = useCallback((error) => {
    if (error instanceof ApiError) {
      return `HTTP_${error.status}`
    }

    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'NETWORK_ERROR'
    }

    if (error.name === 'TimeoutError') {
      return 'TIMEOUT_ERROR'
    }

    return 'UNKNOWN_ERROR'
  }, [])

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether error is retryable
   */
  const isRetryableError = useCallback((error) => {
    if (shouldRetry) {
      return shouldRetry(error)
    }

    if (error instanceof ApiError) {
      // Retry on server errors and some client errors
      return error.status >= 500 || 
             error.status === 408 || 
             error.status === 429
    }

    // Retry on network errors
    return error.name === 'NetworkError' || 
           error.name === 'TimeoutError' ||
           error.message.includes('fetch')
  }, [shouldRetry])

  /**
   * Handle error with retry logic
   * @param {Error} error - Error to handle
   * @param {function(): Promise<any>} retryFunction - Function to retry
   */
  const handleError = useCallback(async (error, retryFunction) => {
    console.error('Error occurred:', error)

    const canRetry = isRetryableError(error) && errorState.retryCount < maxRetries
    const userMessage = showUserMessage ? getUserMessage(error) : null
    const errorCode = getErrorCode(error)

    setErrorState(prev => ({
      ...prev,
      error,
      canRetry,
      userMessage,
      errorCode,
      isLoading: false
    }))

    // Call error callback
    if (onError) {
      onError(error)
    }

    // Auto-retry for certain errors
    if (canRetry && retryFunction) {
      const delay = retryDelay * Math.pow(retryBackoff, errorState.retryCount)
      
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          setErrorState(prev => ({
            ...prev,
            isLoading: true,
            retryCount: prev.retryCount + 1
          }))

          if (onRetry) {
            onRetry(error, errorState.retryCount + 1)
          }

          await retryFunction()
          
          // Success - clear error
          setErrorState({
            error: null,
            isLoading: false,
            retryCount: 0,
            canRetry: false,
            userMessage: null,
            errorCode: null
          })
        } catch (retryError) {
          handleError(retryError, retryFunction)
        }
      }, delay)
    }
  }, [
    errorState.retryCount,
    maxRetries,
    retryDelay,
    retryBackoff,
    showUserMessage,
    isRetryableError,
    getUserMessage,
    getErrorCode,
    onError,
    onRetry
  ])

  /**
   * Execute async function with error handling
   * @param {function(): Promise<any>} asyncFunction - Async function to execute
   * @returns {Promise<any>} Function result
   */
  const executeWithErrorHandling = useCallback(async (asyncFunction) => {
    setErrorState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      userMessage: null
    }))

    try {
      const result = await asyncFunction()
      
      setErrorState({
        error: null,
        isLoading: false,
        retryCount: 0,
        canRetry: false,
        userMessage: null,
        errorCode: null
      })

      return result
    } catch (error) {
      await handleError(error, asyncFunction)
      throw error
    }
  }, [handleError])

  /**
   * Manual retry function
   * @param {function(): Promise<any>} retryFunction - Function to retry
   */
  const retry = useCallback(async (retryFunction) => {
    if (!errorState.canRetry || errorState.retryCount >= maxRetries) {
      return
    }

    try {
      setErrorState(prev => ({
        ...prev,
        isLoading: true,
        retryCount: prev.retryCount + 1
      }))

      if (onRetry) {
        onRetry(errorState.error, errorState.retryCount + 1)
      }

      const result = await retryFunction()
      
      // Success - clear error
      setErrorState({
        error: null,
        isLoading: false,
        retryCount: 0,
        canRetry: false,
        userMessage: null,
        errorCode: null
      })

      return result
    } catch (error) {
      await handleError(error, retryFunction)
      throw error
    }
  }, [errorState, maxRetries, onRetry, handleError])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    setErrorState({
      error: null,
      isLoading: false,
      retryCount: 0,
      canRetry: false,
      userMessage: null,
      errorCode: null
    })
  }, [])

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  const setLoading = useCallback((loading) => {
    setErrorState(prev => ({
      ...prev,
      isLoading: loading
    }))
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...errorState,
    executeWithErrorHandling,
    handleError,
    retry,
    clearError,
    setLoading,
    isMaxRetriesReached: errorState.retryCount >= maxRetries
  }
}

/**
 * Hook for handling form submission errors
 * @param {Object} options - Form error handler options
 * @returns {Object} Form error handling state and functions
 */
export const useFormErrorHandler = (options = {}) => {
  const errorHandler = useErrorHandler({
    maxRetries: 2,
    retryDelay: 2000,
    showUserMessage: true,
    shouldRetry: (error) => {
      // Don't retry validation errors
      if (error instanceof ApiError && error.status === 400) {
        return false
      }
      return true
    },
    ...options
  })

  const [fieldErrors, setFieldErrors] = useState({})

  /**
   * Handle form submission with error handling
   * @param {function(): Promise<any>} submitFunction - Form submit function
   * @returns {Promise<any>} Submit result
   */
  const handleSubmit = useCallback(async (submitFunction) => {
    setFieldErrors({})
    
    try {
      return await errorHandler.executeWithErrorHandling(submitFunction)
    } catch (error) {
      // Extract field errors from API response
      if (error instanceof ApiError && error.details?.fieldErrors) {
        setFieldErrors(error.details.fieldErrors)
      }
      throw error
    }
  }, [errorHandler])

  /**
   * Clear field errors
   */
  const clearFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  return {
    ...errorHandler,
    fieldErrors,
    handleSubmit,
    clearFieldErrors
  }
}

export default useErrorHandler
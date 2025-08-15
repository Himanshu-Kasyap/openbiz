/**
 * @fileoverview Unit tests for useErrorHandler hook
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { renderHook, act } from '@testing-library/react'
import useErrorHandler, { useFormErrorHandler } from '../useErrorHandler'
import { ApiError } from '../../services/api'

// Mock timers
jest.useFakeTimers()

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    expect(result.current.error).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.canRetry).toBe(false)
    expect(result.current.userMessage).toBe(null)
    expect(result.current.errorCode).toBe(null)
    expect(result.current.isMaxRetriesReached).toBe(false)
  })

  it('executes async function successfully', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const asyncFunction = jest.fn().mockResolvedValue('success')
    
    let returnValue
    await act(async () => {
      returnValue = await result.current.executeWithErrorHandling(asyncFunction)
    })
    
    expect(returnValue).toBe('success')
    expect(result.current.error).toBe(null)
    expect(result.current.isLoading).toBe(false)
  })

  it('handles API errors correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const apiError = new ApiError('Bad Request', 400, 'VALIDATION_ERROR')
    const asyncFunction = jest.fn().mockRejectedValue(apiError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBe(apiError)
    expect(result.current.errorCode).toBe('HTTP_400')
    expect(result.current.userMessage).toBe('Please check your information and try again.')
    expect(result.current.canRetry).toBe(false) // 400 errors are not retryable
  })

  it('handles network errors correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const networkError = new Error('fetch failed')
    networkError.name = 'NetworkError'
    const asyncFunction = jest.fn().mockRejectedValue(networkError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBe(networkError)
    expect(result.current.errorCode).toBe('NETWORK_ERROR')
    expect(result.current.userMessage).toBe('Network connection error. Please check your internet connection.')
    expect(result.current.canRetry).toBe(true)
  })

  it('handles server errors with retry', async () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 2 }))
    const serverError = new ApiError('Internal Server Error', 500, 'SERVER_ERROR')
    const asyncFunction = jest.fn().mockRejectedValue(serverError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBe(serverError)
    expect(result.current.canRetry).toBe(true)
    expect(result.current.retryCount).toBe(0) // Initial attempt
  })

  it('auto-retries retryable errors', async () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 2, retryDelay: 1000 }))
    const serverError = new ApiError('Internal Server Error', 500, 'SERVER_ERROR')
    const asyncFunction = jest.fn()
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce('success')
    
    const executePromise = act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // May throw on first attempt
      }
    })
    
    // Advance timer to trigger retry
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    await executePromise
    
    // Should have retried and succeeded
    expect(asyncFunction).toHaveBeenCalledTimes(2)
  })

  it('respects maxRetries limit', async () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 1 }))
    const serverError = new ApiError('Internal Server Error', 500, 'SERVER_ERROR')
    const asyncFunction = jest.fn().mockRejectedValue(serverError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    // Advance timer for retry
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    expect(result.current.retryCount).toBe(1)
    expect(result.current.isMaxRetriesReached).toBe(true)
  })

  it('calls custom error callback', async () => {
    const onError = jest.fn()
    const { result } = renderHook(() => useErrorHandler({ onError }))
    const error = new Error('Test error')
    const asyncFunction = jest.fn().mockRejectedValue(error)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('calls custom retry callback', async () => {
    const onRetry = jest.fn()
    const { result } = renderHook(() => useErrorHandler({ onRetry, retryDelay: 100 }))
    const serverError = new ApiError('Internal Server Error', 500, 'SERVER_ERROR')
    const asyncFunction = jest.fn().mockRejectedValue(serverError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    // Advance timer to trigger retry
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    expect(onRetry).toHaveBeenCalledWith(serverError, 1)
  })

  it('uses custom shouldRetry function', async () => {
    const shouldRetry = jest.fn().mockReturnValue(false)
    const { result } = renderHook(() => useErrorHandler({ shouldRetry }))
    const serverError = new ApiError('Internal Server Error', 500, 'SERVER_ERROR')
    const asyncFunction = jest.fn().mockRejectedValue(serverError)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(shouldRetry).toHaveBeenCalledWith(serverError)
    expect(result.current.canRetry).toBe(false)
  })

  it('uses custom error message generator', async () => {
    const getErrorMessage = jest.fn().mockReturnValue('Custom error message')
    const { result } = renderHook(() => useErrorHandler({ getErrorMessage }))
    const error = new Error('Test error')
    const asyncFunction = jest.fn().mockRejectedValue(error)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(getErrorMessage).toHaveBeenCalledWith(error)
    expect(result.current.userMessage).toBe('Custom error message')
  })

  it('clears error state', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new Error('Test error')
    const asyncFunction = jest.fn().mockRejectedValue(error)
    
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBe(error)
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBe(null)
    expect(result.current.userMessage).toBe(null)
    expect(result.current.retryCount).toBe(0)
  })

  it('sets loading state manually', () => {
    const { result } = renderHook(() => useErrorHandler())
    
    act(() => {
      result.current.setLoading(true)
    })
    
    expect(result.current.isLoading).toBe(true)
    
    act(() => {
      result.current.setLoading(false)
    })
    
    expect(result.current.isLoading).toBe(false)
  })

  it('manual retry works correctly', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const asyncFunction = jest.fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce('success')
    
    // Initial failure
    await act(async () => {
      try {
        await result.current.executeWithErrorHandling(asyncFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBeTruthy()
    
    // Manual retry
    let retryResult
    await act(async () => {
      retryResult = await result.current.retry(asyncFunction)
    })
    
    expect(retryResult).toBe('success')
    expect(result.current.error).toBe(null)
  })
})

describe('useFormErrorHandler', () => {
  it('handles form submission successfully', async () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const submitFunction = jest.fn().mockResolvedValue('success')
    
    let returnValue
    await act(async () => {
      returnValue = await result.current.handleSubmit(submitFunction)
    })
    
    expect(returnValue).toBe('success')
    expect(result.current.fieldErrors).toEqual({})
  })

  it('extracts field errors from API response', async () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const fieldErrors = {
      email: 'Invalid email format',
      password: 'Password too short'
    }
    const apiError = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', { fieldErrors })
    const submitFunction = jest.fn().mockRejectedValue(apiError)
    
    await act(async () => {
      try {
        await result.current.handleSubmit(submitFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.fieldErrors).toEqual(fieldErrors)
  })

  it('clears field errors on new submission', async () => {
    const { result } = renderHook(() => useFormErrorHandler())
    
    // Set initial field errors
    act(() => {
      result.current.clearFieldErrors()
    })
    
    // Simulate field errors
    const fieldErrors = { email: 'Invalid email' }
    const apiError = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', { fieldErrors })
    const submitFunction = jest.fn().mockRejectedValue(apiError)
    
    await act(async () => {
      try {
        await result.current.handleSubmit(submitFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.fieldErrors).toEqual(fieldErrors)
    
    // Clear field errors
    act(() => {
      result.current.clearFieldErrors()
    })
    
    expect(result.current.fieldErrors).toEqual({})
  })

  it('does not retry validation errors', async () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const validationError = new ApiError('Validation failed', 400, 'VALIDATION_ERROR')
    const submitFunction = jest.fn().mockRejectedValue(validationError)
    
    await act(async () => {
      try {
        await result.current.handleSubmit(submitFunction)
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.canRetry).toBe(false)
  })
})
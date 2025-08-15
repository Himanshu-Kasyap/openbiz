/**
 * @fileoverview API integration tests for frontend-backend communication
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import registrationApi from '../../services/registrationApi'
import locationApi from '../../services/locationApi'
import sessionService from '../../services/sessionService'
import { api, ApiError } from '../../services/api'

// Mock fetch for testing
global.fetch = jest.fn()

// Helper function to create mock response
const createMockResponse = (data, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: async () => data,
  headers: {
    get: (key) => key === 'content-type' ? 'application/json' : null
  }
})

describe('API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear()
    jest.clearAllMocks()
  })

  describe('Registration API', () => {
    test('should submit Step 1 data successfully', async () => {
      const mockResponse = {
        success: true,
        sessionId: 'test_session_123',
        nextStep: 2,
        message: 'Aadhaar verification completed successfully'
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await registrationApi.submitStep1({
        aadhaarNumber: '123456789012',
        otp: '123456',
        sessionId: 'existing_session'
      })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/registration/step1',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            aadhaarNumber: '123456789012',
            otp: '123456',
            sessionId: 'existing_session'
          })
        })
      )

      expect(result).toEqual(mockResponse)
    })

    test('should submit Step 2 data successfully', async () => {
      const mockResponse = {
        success: true,
        sessionId: 'test_session_123',
        status: 'completed',
        message: 'Registration completed successfully'
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const personalDetails = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        mobileNumber: '9876543210',
        email: 'john.doe@example.com',
        address: {
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001'
        }
      }

      const result = await registrationApi.submitStep2({
        sessionId: 'test_session_123',
        panNumber: 'ABCDE1234F',
        personalDetails
      })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/registration/step2',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test_session_123',
            panNumber: 'ABCDE1234F',
            personalDetails
          })
        })
      )

      expect(result).toEqual(mockResponse)
    })

    test('should get registration status successfully', async () => {
      const mockResponse = {
        sessionId: 'test_session_123',
        status: 'step1_completed',
        currentStep: 2,
        steps: {
          step1: { completed: true, completedAt: '2024-01-01T10:00:00Z' },
          step2: { completed: false, completedAt: null }
        },
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await registrationApi.getRegistrationStatus('test_session_123')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/registration/test_session_123/status',
        expect.objectContaining({
          method: 'GET'
        })
      )

      expect(result).toEqual(mockResponse)
    })

    test('should validate individual fields', async () => {
      const mockResponse = {
        data: {
          field: 'panNumber',
          value: 'ABCDE1234F',
          isValid: true,
          message: 'Valid PAN number'
        }
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await registrationApi.validateField('panNumber', 'ABCDE1234F')

      expect(result).toEqual(mockResponse.data)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/validate-field',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            field: 'panNumber',
            value: 'ABCDE1234F'
          })
        })
      )
    })

    test('should handle API errors properly', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP. Please check and try again.',
          details: { field: 'otp' }
        }
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockErrorResponse, false, 400))

      await expect(registrationApi.submitStep1({
        aadhaarNumber: '123456789012',
        otp: '000000'
      })).rejects.toThrow(ApiError)

      try {
        await registrationApi.submitStep1({
          aadhaarNumber: '123456789012',
          otp: '000000'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error.status).toBe(400)
        expect(error.code).toBe('INVALID_OTP')
        expect(error.message).toBe('Invalid OTP. Please check and try again.')
      }
    })
  })

  describe('Location API', () => {
    test('should fetch location by PIN code successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          pincode: '110001',
          city: 'New Delhi',
          state: 'Delhi',
          district: 'Central Delhi',
          country: 'India'
        },
        metadata: {
          source: 'location_service',
          timestamp: '2024-01-01T10:00:00Z',
          cached: false
        }
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await locationApi.getLocationByPincode('110001')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/pincode/110001/location',
        expect.objectContaining({
          method: 'GET'
        })
      )

      expect(result).toEqual(mockResponse.data)
    })

    test('should handle invalid PIN code format', async () => {
      await expect(locationApi.getLocationByPincode('12345')).rejects.toThrow(
        'Invalid PIN code format. Must be 6 digits.'
      )

      await expect(locationApi.getLocationByPincode('abcdef')).rejects.toThrow(
        'Invalid PIN code format. Must be 6 digits.'
      )
    })

    test('should use cached location data', async () => {
      const mockLocationData = {
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        country: 'India'
      }

      // Clear cache first
      locationApi.clearCache()

      // First call - should fetch from API
      fetch.mockResolvedValueOnce(createMockResponse({
        success: true,
        data: mockLocationData
      }))

      const result1 = await locationApi.getLocationByPincode('110001')
      expect(result1).toEqual(mockLocationData)
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      const result2 = await locationApi.getLocationByPincode('110001')
      expect(result2).toEqual(mockLocationData)
      expect(fetch).toHaveBeenCalledTimes(1) // No additional API call
    })

    test('should get form schema successfully', async () => {
      const mockSchema = {
        success: true,
        data: {
          version: '1.0.0',
          title: 'Udyam Registration Form',
          description: 'Multi-step registration form for Udyam portal',
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
              title: 'PAN & Personal Details',
              fields: [
                { name: 'panNumber', type: 'text', required: true },
                { name: 'fullName', type: 'text', required: true }
              ]
            }
          ]
        }
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockSchema))

      const result = await locationApi.getFormSchema()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/form-schema',
        expect.objectContaining({
          method: 'GET'
        })
      )

      expect(result).toEqual(mockSchema.data)
    })
  })

  describe('API Client Error Handling', () => {
    test('should retry on network errors', async () => {
      // First two calls fail, third succeeds
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse({ success: true, data: 'success' }))

      const result = await api.get('/test-endpoint')

      expect(fetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ success: true, data: 'success' })
    })

    test('should handle timeout errors', async () => {
      // Mock a slow response that times out
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 15000)) // 15 seconds, longer than 10s timeout
      )

      await expect(api.get('/test-endpoint')).rejects.toThrow()
    })

    test('should handle server errors with retry', async () => {
      // First call returns 500, second call succeeds
      fetch
        .mockResolvedValueOnce(createMockResponse({ error: { message: 'Server error' } }, false, 500))
        .mockResolvedValueOnce(createMockResponse({ success: true, data: 'success' }))

      const result = await api.get('/test-endpoint')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ success: true, data: 'success' })
    })

    test('should not retry on client errors (4xx)', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data'
        }
      }, false, 400))

      await expect(api.get('/test-endpoint')).rejects.toThrow(ApiError)
      expect(fetch).toHaveBeenCalledTimes(1) // No retry for 4xx errors
    })
  })

  describe('Session Service Integration', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })
    })

    test('should save and load session data', () => {
      const sessionData = {
        sessionId: 'test_session_123',
        currentStep: 2,
        formData: {
          aadhaarNumber: '123456789012',
          panNumber: 'ABCDE1234F'
        },
        completedSteps: [true, false],
        lastUpdated: '2024-01-01T10:00:00Z'
      }

      // Mock localStorage.getItem to return saved session
      window.localStorage.getItem.mockImplementation((key) => {
        const data = {
          'udyam_session_id': sessionData.sessionId,
          'udyam_form_data': JSON.stringify(sessionData.formData),
          'udyam_current_step': sessionData.currentStep.toString(),
          'udyam_completed_steps': JSON.stringify(sessionData.completedSteps),
          'udyam_last_updated': sessionData.lastUpdated
        }
        return data[key] || null
      })

      sessionService.saveSession(sessionData)

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'udyam_session_id',
        sessionData.sessionId
      )
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'udyam_form_data',
        JSON.stringify(sessionData.formData)
      )

      const loadedSession = sessionService.loadSession()
      expect(loadedSession).toEqual(expect.objectContaining({
        sessionId: sessionData.sessionId,
        currentStep: sessionData.currentStep,
        formData: sessionData.formData,
        completedSteps: sessionData.completedSteps
      }))
    })

    test('should handle expired sessions', () => {
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago

      window.localStorage.getItem.mockImplementation((key) => {
        const data = {
          'udyam_session_id': 'expired_session',
          'udyam_form_data': JSON.stringify({}),
          'udyam_current_step': '1',
          'udyam_completed_steps': JSON.stringify([false, false]),
          'udyam_last_updated': expiredDate.toISOString()
        }
        return data[key] || null
      })

      const session = sessionService.loadSession()
      expect(session).toBeNull()

      // Should clear expired session data
      expect(window.localStorage.removeItem).toHaveBeenCalled()
    })

    test('should handle corrupted session data', () => {
      window.localStorage.getItem.mockImplementation((key) => {
        if (key === 'udyam_form_data') {
          return 'invalid json'
        }
        if (key === 'udyam_session_id') {
          return 'test_session'
        }
        return null
      })

      const session = sessionService.loadSession()
      expect(session).toBeNull()

      // Should clear corrupted data
      expect(window.localStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('Real-time Field Validation', () => {
    test('should validate fields in real-time', async () => {
      const mockValidationResponse = {
        success: true,
        data: {
          field: 'aadhaarNumber',
          value: '123456789012',
          isValid: true,
          message: 'Valid Aadhaar number'
        }
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockValidationResponse))

      const result = await registrationApi.validateField('aadhaarNumber', '123456789012')

      expect(result).toEqual(mockValidationResponse.data)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/validate-field',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            field: 'aadhaarNumber',
            value: '123456789012'
          })
        })
      )
    })

    test('should handle validation errors', async () => {
      const mockValidationResponse = {
        success: true,
        data: {
          field: 'panNumber',
          value: 'INVALID',
          isValid: false,
          message: 'PAN number must follow format: 5 letters, 4 digits, 1 letter',
          suggestions: [
            'PAN should start with 5 letters',
            'PAN should have 4 digits after the first 5 letters',
            'PAN should end with a letter'
          ]
        }
      }

      fetch.mockResolvedValueOnce(createMockResponse(mockValidationResponse))

      const result = await registrationApi.validateField('panNumber', 'INVALID')

      expect(result).toEqual(mockValidationResponse.data)
      expect(result.isValid).toBe(false)
      expect(result.suggestions).toHaveLength(3)
    })
  })
})
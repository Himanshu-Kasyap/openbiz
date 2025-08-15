/**
 * @fileoverview Unit tests for formRecoveryService
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { renderHook, act } from '@testing-library/react'
import formRecoveryService, { useFormRecovery } from '../formRecoveryService'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window events
const mockDispatchEvent = jest.fn()
global.window.dispatchEvent = mockDispatchEvent

// Mock timers
jest.useFakeTimers()

describe('FormRecoveryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  describe('saveFormData', () => {
    it('saves form data to localStorage', () => {
      const formData = { name: 'John', email: 'john@example.com' }
      const step = 1
      const sessionId = 'session123'
      const metadata = { source: 'test' }

      formRecoveryService.saveFormData(formData, step, sessionId, metadata)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'udyam_form_recovery',
        expect.stringContaining('"step":1')
      )
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'formDataSaved'
        })
      )
    })

    it('sanitizes sensitive data before saving', () => {
      const formData = {
        name: 'John',
        aadhaarNumber: '123456789012',
        otp: '123456',
        password: 'secret'
      }

      formRecoveryService.saveFormData(formData, 1, 'session123')

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.formData.name).toBe('John')
      expect(savedData.formData.aadhaarNumber).toBe('XXXX-XXXX-9012')
      expect(savedData.formData.otp).toBeUndefined()
      expect(savedData.formData.password).toBeUndefined()
    })

    it('handles save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      formRecoveryService.saveFormData({ name: 'John' }, 1, 'session123')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save form data for recovery:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('loadFormData', () => {
    it('loads valid form data from localStorage', () => {
      const recoveryData = {
        formData: { name: 'John' },
        step: 1,
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        metadata: {}
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recoveryData))

      const result = formRecoveryService.loadFormData()

      expect(result).toEqual(recoveryData)
    })

    it('returns null when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = formRecoveryService.loadFormData()

      expect(result).toBe(null)
    })

    it('returns null for expired data', () => {
      const expiredData = {
        formData: { name: 'John' },
        step: 1,
        sessionId: 'session123',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        metadata: {}
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData))

      const result = formRecoveryService.loadFormData()

      expect(result).toBe(null)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('udyam_form_recovery')
    })

    it('handles load errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = formRecoveryService.loadFormData()

      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load form data for recovery:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('handles invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = formRecoveryService.loadFormData()

      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('hasRecoveryData', () => {
    it('returns true when valid recovery data exists', () => {
      const recoveryData = {
        formData: { name: 'John' },
        step: 1,
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        metadata: {}
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recoveryData))

      expect(formRecoveryService.hasRecoveryData()).toBe(true)
    })

    it('returns false when no recovery data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      expect(formRecoveryService.hasRecoveryData()).toBe(false)
    })
  })

  describe('clearFormData', () => {
    it('removes data from localStorage', () => {
      formRecoveryService.clearFormData()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('udyam_form_recovery')
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'formDataCleared'
        })
      )
    })
  })

  describe('getRecoveryDataAge', () => {
    it('returns age in minutes for existing data', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const recoveryData = {
        formData: { name: 'John' },
        step: 1,
        sessionId: 'session123',
        timestamp: fiveMinutesAgo,
        metadata: {}
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recoveryData))

      const age = formRecoveryService.getRecoveryDataAge()

      expect(age).toBe(5)
    })

    it('returns null when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const age = formRecoveryService.getRecoveryDataAge()

      expect(age).toBe(null)
    })
  })

  describe('auto-save functionality', () => {
    it('starts auto-save with provided functions', () => {
      const getFormData = jest.fn().mockReturnValue({ name: 'John' })
      const getCurrentStep = jest.fn().mockReturnValue(1)
      const getSessionId = jest.fn().mockReturnValue('session123')

      formRecoveryService.startAutoSave(getFormData, getCurrentStep, getSessionId)

      // Advance timer to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(getFormData).toHaveBeenCalled()
      expect(getCurrentStep).toHaveBeenCalled()
      expect(getSessionId).toHaveBeenCalled()
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('stops auto-save when requested', () => {
      const getFormData = jest.fn().mockReturnValue({ name: 'John' })
      const getCurrentStep = jest.fn().mockReturnValue(1)
      const getSessionId = jest.fn().mockReturnValue('session123')

      formRecoveryService.startAutoSave(getFormData, getCurrentStep, getSessionId)
      formRecoveryService.stopAutoSave()

      // Advance timer - should not trigger auto-save
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(getFormData).not.toHaveBeenCalled()
    })

    it('handles auto-save errors gracefully', () => {
      const getFormData = jest.fn().mockImplementation(() => {
        throw new Error('Form data error')
      })
      const getCurrentStep = jest.fn().mockReturnValue(1)
      const getSessionId = jest.fn().mockReturnValue('session123')

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      formRecoveryService.startAutoSave(getFormData, getCurrentStep, getSessionId)

      // Advance timer to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Auto-save failed:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('getRecoveryPromptData', () => {
    it('returns prompt data for existing recovery data', () => {
      const recoveryData = {
        formData: { name: 'John', email: 'john@example.com' },
        step: 1,
        sessionId: 'session123',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        metadata: {}
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recoveryData))

      const promptData = formRecoveryService.getRecoveryPromptData()

      expect(promptData).toEqual({
        step: 1,
        ageMinutes: 10,
        formFields: 2,
        timestamp: recoveryData.timestamp,
        hasData: true
      })
    })

    it('returns null when no recovery data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const promptData = formRecoveryService.getRecoveryPromptData()

      expect(promptData).toBe(null)
    })
  })

  describe('mergeFormData', () => {
    it('merges current data with recovery data, prioritizing current', () => {
      const currentData = { name: 'Jane', email: 'jane@example.com' }
      const recoveryData = { formData: { name: 'John', phone: '123456789' } }

      const merged = formRecoveryService.mergeFormData(currentData, recoveryData)

      expect(merged).toEqual({
        name: 'Jane', // Current data takes priority
        phone: '123456789', // Recovery data fills gaps
        email: 'jane@example.com' // Current data preserved
      })
    })
  })

  describe('validateRecoveryData', () => {
    it('validates correct recovery data structure', () => {
      const validData = {
        formData: { name: 'John' },
        step: 1,
        timestamp: new Date().toISOString(),
        sessionId: 'session123'
      }

      expect(formRecoveryService.validateRecoveryData(validData)).toBe(true)
    })

    it('rejects invalid data structures', () => {
      expect(formRecoveryService.validateRecoveryData(null)).toBe(false)
      expect(formRecoveryService.validateRecoveryData({})).toBe(false)
      expect(formRecoveryService.validateRecoveryData({
        formData: { name: 'John' }
        // Missing required fields
      })).toBe(false)
    })

    it('rejects data with invalid timestamp', () => {
      const invalidData = {
        formData: { name: 'John' },
        step: 1,
        timestamp: 'invalid-date'
      }

      expect(formRecoveryService.validateRecoveryData(invalidData)).toBe(false)
    })

    it('rejects data with invalid step', () => {
      const invalidData = {
        formData: { name: 'John' },
        step: -1,
        timestamp: new Date().toISOString()
      }

      expect(formRecoveryService.validateRecoveryData(invalidData)).toBe(false)
    })
  })
})

describe('useFormRecovery hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useFormRecovery())

    expect(result.current.hasRecoveryData).toBe(false)
    expect(typeof result.current.saveFormData).toBe('function')
    expect(typeof result.current.loadFormData).toBe('function')
    expect(typeof result.current.clearFormData).toBe('function')
  })

  it('updates hasRecoveryData when data is saved', () => {
    const { result } = renderHook(() => useFormRecovery())

    expect(result.current.hasRecoveryData).toBe(false)

    act(() => {
      result.current.saveFormData({ name: 'John' }, 1, 'session123')
    })

    // Simulate storage event
    act(() => {
      window.dispatchEvent(new CustomEvent('formDataSaved'))
    })

    // Mock that data now exists
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      formData: { name: 'John' },
      step: 1,
      timestamp: new Date().toISOString()
    }))

    // Re-render to check updated state
    const { result: newResult } = renderHook(() => useFormRecovery())
    expect(newResult.current.hasRecoveryData).toBe(true)
  })

  it('starts auto-save when enabled', () => {
    const { result } = renderHook(() => useFormRecovery({ autoSave: true }))

    const getFormData = jest.fn().mockReturnValue({ name: 'John' })
    const getCurrentStep = jest.fn().mockReturnValue(1)
    const getSessionId = jest.fn().mockReturnValue('session123')

    act(() => {
      result.current.startAutoSave(getFormData, getCurrentStep, getSessionId)
    })

    // Advance timer to trigger auto-save
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(getFormData).toHaveBeenCalled()
  })

  it('does not start auto-save when disabled', () => {
    const { result } = renderHook(() => useFormRecovery({ autoSave: false }))

    const getFormData = jest.fn().mockReturnValue({ name: 'John' })
    const getCurrentStep = jest.fn().mockReturnValue(1)
    const getSessionId = jest.fn().mockReturnValue('session123')

    act(() => {
      result.current.startAutoSave(getFormData, getCurrentStep, getSessionId)
    })

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(getFormData).not.toHaveBeenCalled()
  })
})
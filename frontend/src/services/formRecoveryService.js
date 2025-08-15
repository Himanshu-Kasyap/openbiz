/**
 * @fileoverview Form data recovery service for persisting and recovering form data
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * @typedef {Object} FormRecoveryData
 * @property {Object} formData - Form field data
 * @property {number} step - Current step
 * @property {string} timestamp - ISO timestamp
 * @property {string} sessionId - Session identifier
 * @property {Object} metadata - Additional metadata
 */

/**
 * Form data recovery service
 */
class FormRecoveryService {
  constructor() {
    this.storageKey = 'udyam_form_recovery'
    this.maxRecoveryAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    this.autoSaveInterval = 5000 // 5 seconds
    this.autoSaveTimer = null
  }

  /**
   * Save form data to localStorage
   * @param {Object} formData - Form data to save
   * @param {number} step - Current step
   * @param {string} sessionId - Session ID
   * @param {Object} metadata - Additional metadata
   */
  saveFormData(formData, step, sessionId, metadata = {}) {
    try {
      const recoveryData = {
        formData: this.sanitizeFormData(formData),
        step,
        sessionId,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(recoveryData))
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('formDataSaved', {
        detail: { recoveryData }
      }))
    } catch (error) {
      console.error('Failed to save form data for recovery:', error)
    }
  }

  /**
   * Load form data from localStorage
   * @returns {FormRecoveryData|null} Recovered form data or null
   */
  loadFormData() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return null
      }

      const recoveryData = JSON.parse(stored)
      
      // Check if data is not too old
      const dataAge = Date.now() - new Date(recoveryData.timestamp).getTime()
      if (dataAge > this.maxRecoveryAge) {
        this.clearFormData()
        return null
      }

      return recoveryData
    } catch (error) {
      console.error('Failed to load form data for recovery:', error)
      return null
    }
  }

  /**
   * Check if recovery data exists
   * @returns {boolean} True if recovery data exists
   */
  hasRecoveryData() {
    const data = this.loadFormData()
    return data !== null
  }

  /**
   * Clear saved form data
   */
  clearFormData() {
    try {
      localStorage.removeItem(this.storageKey)
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('formDataCleared'))
    } catch (error) {
      console.error('Failed to clear form recovery data:', error)
    }
  }

  /**
   * Get recovery data age in minutes
   * @returns {number|null} Age in minutes or null if no data
   */
  getRecoveryDataAge() {
    const data = this.loadFormData()
    if (!data) {
      return null
    }

    const ageMs = Date.now() - new Date(data.timestamp).getTime()
    return Math.floor(ageMs / (1000 * 60))
  }

  /**
   * Start auto-save for form data
   * @param {function(): Object} getFormData - Function to get current form data
   * @param {function(): number} getCurrentStep - Function to get current step
   * @param {function(): string} getSessionId - Function to get session ID
   */
  startAutoSave(getFormData, getCurrentStep, getSessionId) {
    this.stopAutoSave() // Clear any existing timer

    this.autoSaveTimer = setInterval(() => {
      try {
        const formData = getFormData()
        const step = getCurrentStep()
        const sessionId = getSessionId()

        if (formData && Object.keys(formData).length > 0) {
          this.saveFormData(formData, step, sessionId, {
            autoSaved: true
          })
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, this.autoSaveInterval)
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * Sanitize form data before saving (remove sensitive data)
   * @param {Object} formData - Raw form data
   * @returns {Object} Sanitized form data
   */
  sanitizeFormData(formData) {
    const sanitized = { ...formData }
    
    // Remove sensitive fields that shouldn't be persisted
    const sensitiveFields = ['otp', 'password', 'confirmPassword']
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field]
      }
    })

    // Mask partial sensitive data
    if (sanitized.aadhaarNumber) {
      sanitized.aadhaarNumber = this.maskAadhaar(sanitized.aadhaarNumber)
    }

    return sanitized
  }

  /**
   * Mask Aadhaar number for security
   * @param {string} aadhaar - Aadhaar number
   * @returns {string} Masked Aadhaar number
   */
  maskAadhaar(aadhaar) {
    if (!aadhaar || aadhaar.length < 12) {
      return aadhaar
    }
    
    // Show only last 4 digits
    return 'XXXX-XXXX-' + aadhaar.slice(-4)
  }

  /**
   * Create recovery prompt data for user confirmation
   * @returns {Object|null} Recovery prompt data
   */
  getRecoveryPromptData() {
    const data = this.loadFormData()
    if (!data) {
      return null
    }

    const ageMinutes = this.getRecoveryDataAge()
    const formFields = Object.keys(data.formData).length

    return {
      step: data.step,
      ageMinutes,
      formFields,
      timestamp: data.timestamp,
      hasData: formFields > 0
    }
  }

  /**
   * Merge recovery data with current form data
   * @param {Object} currentData - Current form data
   * @param {Object} recoveryData - Recovery data
   * @returns {Object} Merged form data
   */
  mergeFormData(currentData, recoveryData) {
    // Prioritize current data over recovery data
    return {
      ...recoveryData.formData,
      ...currentData
    }
  }

  /**
   * Export form data for debugging or support
   * @returns {string|null} JSON string of form data
   */
  exportFormData() {
    const data = this.loadFormData()
    if (!data) {
      return null
    }

    // Create export data without sensitive information
    const exportData = {
      step: data.step,
      timestamp: data.timestamp,
      fieldCount: Object.keys(data.formData).length,
      fields: Object.keys(data.formData),
      metadata: data.metadata
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Validate recovery data integrity
   * @param {FormRecoveryData} data - Recovery data to validate
   * @returns {boolean} True if data is valid
   */
  validateRecoveryData(data) {
    if (!data || typeof data !== 'object') {
      return false
    }

    const requiredFields = ['formData', 'step', 'timestamp']
    const hasRequiredFields = requiredFields.every(field => 
      data.hasOwnProperty(field)
    )

    if (!hasRequiredFields) {
      return false
    }

    // Validate timestamp
    const timestamp = new Date(data.timestamp)
    if (isNaN(timestamp.getTime())) {
      return false
    }

    // Validate step
    if (typeof data.step !== 'number' || data.step < 0) {
      return false
    }

    // Validate form data
    if (typeof data.formData !== 'object') {
      return false
    }

    return true
  }
}

// Create singleton instance
const formRecoveryService = new FormRecoveryService()

/**
 * React hook for form recovery functionality
 * @param {Object} options - Hook options
 * @param {boolean} [options.autoSave=true] - Enable auto-save
 * @param {number} [options.autoSaveInterval=5000] - Auto-save interval in ms
 * @returns {Object} Recovery functions and state
 */
export const useFormRecovery = ({
  autoSave = true,
  autoSaveInterval = 5000
} = {}) => {
  const [hasRecoveryData, setHasRecoveryData] = useState(
    formRecoveryService.hasRecoveryData()
  )

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      setHasRecoveryData(formRecoveryService.hasRecoveryData())
    }

    window.addEventListener('formDataSaved', handleStorageChange)
    window.addEventListener('formDataCleared', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('formDataSaved', handleStorageChange)
      window.removeEventListener('formDataCleared', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const saveFormData = useCallback((formData, step, sessionId, metadata) => {
    formRecoveryService.saveFormData(formData, step, sessionId, metadata)
  }, [])

  const loadFormData = useCallback(() => {
    return formRecoveryService.loadFormData()
  }, [])

  const clearFormData = useCallback(() => {
    formRecoveryService.clearFormData()
  }, [])

  const getRecoveryPromptData = useCallback(() => {
    return formRecoveryService.getRecoveryPromptData()
  }, [])

  const startAutoSave = useCallback((getFormData, getCurrentStep, getSessionId) => {
    if (autoSave) {
      formRecoveryService.autoSaveInterval = autoSaveInterval
      formRecoveryService.startAutoSave(getFormData, getCurrentStep, getSessionId)
    }
  }, [autoSave, autoSaveInterval])

  const stopAutoSave = useCallback(() => {
    formRecoveryService.stopAutoSave()
  }, [])

  return {
    hasRecoveryData,
    saveFormData,
    loadFormData,
    clearFormData,
    getRecoveryPromptData,
    startAutoSave,
    stopAutoSave,
    exportFormData: formRecoveryService.exportFormData.bind(formRecoveryService),
    getRecoveryDataAge: formRecoveryService.getRecoveryDataAge.bind(formRecoveryService)
  }
}

export default formRecoveryService
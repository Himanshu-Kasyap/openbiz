/**
 * @fileoverview Session management service for form state persistence
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} SessionData
 * @property {string} sessionId
 * @property {number} currentStep
 * @property {Object} formData
 * @property {boolean[]} completedSteps
 * @property {string} lastUpdated
 */

/**
 * Session storage keys
 */
const STORAGE_KEYS = {
  SESSION_ID: 'udyam_session_id',
  FORM_DATA: 'udyam_form_data',
  CURRENT_STEP: 'udyam_current_step',
  COMPLETED_STEPS: 'udyam_completed_steps',
  LAST_UPDATED: 'udyam_last_updated'
}

/**
 * Session timeout in milliseconds (24 hours)
 */
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000

/**
 * Check if we're in a browser environment
 * @returns {boolean}
 */
const isBrowser = () => typeof window !== 'undefined'

/**
 * Session management service
 */
const sessionService = {
  /**
   * Generate a new session ID
   * @returns {string}
   */
  generateSessionId() {
    return `udyam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Save session data to localStorage
   * @param {SessionData} sessionData
   */
  saveSession(sessionData) {
    if (!isBrowser()) return

    try {
      const dataToSave = {
        ...sessionData,
        lastUpdated: new Date().toISOString()
      }

      localStorage.setItem(STORAGE_KEYS.SESSION_ID, dataToSave.sessionId)
      localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(dataToSave.formData))
      localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, dataToSave.currentStep.toString())
      localStorage.setItem(STORAGE_KEYS.COMPLETED_STEPS, JSON.stringify(dataToSave.completedSteps))
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, dataToSave.lastUpdated)
    } catch (error) {
      console.error('Failed to save session data:', error)
    }
  },

  /**
   * Load session data from localStorage
   * @returns {SessionData|null}
   */
  loadSession() {
    if (!isBrowser()) return null

    try {
      const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID)
      const formDataStr = localStorage.getItem(STORAGE_KEYS.FORM_DATA)
      const currentStepStr = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
      const completedStepsStr = localStorage.getItem(STORAGE_KEYS.COMPLETED_STEPS)
      const lastUpdated = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED)

      // Check if all required data exists
      if (!sessionId || !formDataStr || !currentStepStr || !completedStepsStr || !lastUpdated) {
        return null
      }

      // Check if session has expired
      const lastUpdatedTime = new Date(lastUpdated).getTime()
      if (Date.now() - lastUpdatedTime > SESSION_TIMEOUT) {
        this.clearSession()
        return null
      }

      return {
        sessionId,
        formData: JSON.parse(formDataStr),
        currentStep: parseInt(currentStepStr, 10),
        completedSteps: JSON.parse(completedStepsStr),
        lastUpdated
      }
    } catch (error) {
      console.error('Failed to load session data:', error)
      this.clearSession() // Clear corrupted data
      return null
    }
  },

  /**
   * Update form data in session
   * @param {Object} formData
   */
  updateFormData(formData) {
    if (!isBrowser()) return

    const existingSession = this.loadSession()
    if (existingSession) {
      this.saveSession({
        ...existingSession,
        formData: { ...existingSession.formData, ...formData }
      })
    }
  },

  /**
   * Update current step in session
   * @param {number} step
   */
  updateCurrentStep(step) {
    if (!isBrowser()) return

    const existingSession = this.loadSession()
    if (existingSession) {
      this.saveSession({
        ...existingSession,
        currentStep: step
      })
    }
  },

  /**
   * Mark step as completed
   * @param {number} stepIndex - Zero-based step index
   */
  markStepCompleted(stepIndex) {
    if (!isBrowser()) return

    const existingSession = this.loadSession()
    if (existingSession) {
      const completedSteps = [...existingSession.completedSteps]
      completedSteps[stepIndex] = true
      
      this.saveSession({
        ...existingSession,
        completedSteps
      })
    }
  },

  /**
   * Clear session data
   */
  clearSession() {
    if (!isBrowser()) return

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear session data:', error)
    }
  },

  /**
   * Check if session exists and is valid
   * @returns {boolean}
   */
  hasValidSession() {
    return this.loadSession() !== null
  },

  /**
   * Get session ID
   * @returns {string|null}
   */
  getSessionId() {
    const session = this.loadSession()
    return session ? session.sessionId : null
  },

  /**
   * Initialize new session
   * @param {Object} initialFormData
   * @returns {string} Session ID
   */
  initializeSession(initialFormData = {}) {
    const sessionId = this.generateSessionId()
    
    const sessionData = {
      sessionId,
      currentStep: 1,
      formData: initialFormData,
      completedSteps: [false, false],
      lastUpdated: new Date().toISOString()
    }

    this.saveSession(sessionData)
    return sessionId
  },

  /**
   * Get session info for debugging
   * @returns {Object}
   */
  getSessionInfo() {
    const session = this.loadSession()
    if (!session) {
      return { exists: false }
    }

    return {
      exists: true,
      sessionId: session.sessionId,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      lastUpdated: session.lastUpdated,
      formDataKeys: Object.keys(session.formData),
      isExpired: Date.now() - new Date(session.lastUpdated).getTime() > SESSION_TIMEOUT
    }
  }
}

export default sessionService
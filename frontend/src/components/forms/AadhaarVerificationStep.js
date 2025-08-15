import { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import AadhaarInput from './AadhaarInput'
import OTPInput from './OTPInput'
import { Button } from '../ui'
import { validators } from '../../utils/validation'
import registrationApi from '../../services/registrationApi'
import sessionService from '../../services/sessionService'

/**
 * AadhaarVerificationStep component with OTP flow
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {function} props.onDataChange - Handler for form data changes
 * @param {function} props.onStepComplete - Handler for step completion
 * @param {boolean} [props.disabled=false] - Whether the step is disabled
 * @param {Object} [props.errors={}] - Validation errors
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
const AadhaarVerificationStep = ({
  formData = {},
  onDataChange,
  onStepComplete,
  disabled = false,
  errors = {},
  isLoading = false,
  className
}) => {
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Handle Aadhaar number change
  const handleAadhaarChange = useCallback((e) => {
    const aadhaarNumber = e.target.value
    onDataChange({
      ...formData,
      aadhaarNumber,
      otp: '' // Clear OTP when Aadhaar changes
    })
    
    // Reset OTP states if Aadhaar is invalid
    if (!validators.isValidAadhaar(aadhaarNumber)) {
      setOtpSent(false)
      setOtpVerified(false)
    }
  }, [formData, onDataChange])

  // Handle OTP change
  const handleOtpChange = useCallback((e) => {
    const otp = e.target.value
    onDataChange({
      ...formData,
      otp
    })
  }, [formData, onDataChange])

  // Handle send OTP
  const handleSendOtp = useCallback(async () => {
    if (!validators.isValidAadhaar(formData.aadhaarNumber)) {
      return
    }

    setSendingOtp(true)
    try {
      // Send OTP request to backend (simulated for now)
      // In real implementation, this would trigger OTP generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      setOtpSent(true)
      
      // Update session with Aadhaar number
      sessionService.updateFormData({ aadhaarNumber: formData.aadhaarNumber })
    } catch (error) {
      console.error('Failed to send OTP:', error)
      // Handle error appropriately
    } finally {
      setSendingOtp(false)
    }
  }, [formData.aadhaarNumber])

  // Handle OTP verification
  const handleVerifyOtp = useCallback(async () => {
    if (!validators.isValidOTP(formData.otp)) {
      return
    }

    setVerifyingOtp(true)
    try {
      // Get or create session ID
      let sessionId = sessionService.getSessionId()
      if (!sessionId) {
        sessionId = sessionService.initializeSession(formData)
      }

      // Submit Step 1 to backend API
      const response = await registrationApi.submitStep1({
        aadhaarNumber: formData.aadhaarNumber,
        otp: formData.otp,
        sessionId
      })

      if (response.success) {
        setOtpVerified(true)
        
        // Update session with response data
        sessionService.updateFormData({ 
          ...formData, 
          sessionId: response.sessionId,
          stepCompleted: true 
        })
        sessionService.markStepCompleted(0) // Mark step 1 as completed
        
        // Mark step as complete
        if (onStepComplete) {
          onStepComplete({
            ...formData,
            sessionId: response.sessionId,
            stepCompleted: true
          })
        }
      } else {
        throw new Error('OTP verification failed')
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error)
      
      // Handle specific API errors
      if (error.status === 400) {
        // Invalid OTP or Aadhaar - show user-friendly error
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: 'Invalid OTP. Please check and try again.'
          })
        }
      } else if (error.status === 429) {
        // Rate limited
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: 'Too many attempts. Please try again later.'
          })
        }
      } else if (error.name === 'ApiError') {
        // API-specific error
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: error.message || 'Verification failed. Please try again.'
          })
        }
      } else {
        // Network or other errors
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: 'Network error. Please check your connection and try again.'
          })
        }
      }
    } finally {
      setVerifyingOtp(false)
    }
  }, [formData, onStepComplete, onDataChange])

  // Handle OTP completion (auto-verify when 6 digits entered)
  const handleOtpComplete = useCallback((otp) => {
    onDataChange({
      ...formData,
      otp
    })
    
    // Auto-verify if OTP is valid
    if (validators.isValidOTP(otp)) {
      setTimeout(() => {
        handleVerifyOtp()
      }, 500)
    }
  }, [formData, onDataChange, handleVerifyOtp])

  const isAadhaarValid = validators.isValidAadhaar(formData.aadhaarNumber || '')
  const isOtpValid = validators.isValidOTP(formData.otp || '')
  const canSendOtp = isAadhaarValid && !otpSent && !sendingOtp
  const canVerifyOtp = otpSent && isOtpValid && !otpVerified && !verifyingOtp

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Step header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Aadhaar Verification
        </h2>
        <p className="text-gray-600">
          Verify your identity using your 12-digit Aadhaar number
        </p>
      </div>

      {/* Aadhaar input */}
      <div className="max-w-md mx-auto">
        <AadhaarInput
          value={formData.aadhaarNumber || ''}
          onChange={handleAadhaarChange}
          error={errors.aadhaarNumber}
          disabled={disabled || otpVerified}
          required
        />
        
        {/* Send OTP button */}
        {isAadhaarValid && !otpVerified && (
          <div className="mt-4">
            <Button
              onClick={handleSendOtp}
              disabled={!canSendOtp || disabled}
              loading={sendingOtp}
              variant="primary"
              size="md"
              className="w-full"
            >
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </Button>
          </div>
        )}
      </div>

      {/* OTP input section */}
      {otpSent && !otpVerified && (
        <div className="max-w-md mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-blue-800">
                OTP has been sent to your registered mobile number
              </p>
            </div>
          </div>

          <OTPInput
            value={formData.otp || ''}
            onChange={handleOtpChange}
            onComplete={handleOtpComplete}
            error={errors.otp}
            disabled={disabled}
            autoFocus
            required
          />

          {/* Verify OTP button */}
          <div className="mt-4">
            <Button
              onClick={handleVerifyOtp}
              disabled={!canVerifyOtp || disabled}
              loading={verifyingOtp}
              variant="primary"
              size="md"
              className="w-full"
            >
              Verify OTP
            </Button>
          </div>

          {/* Resend OTP link */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || disabled}
              className="text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400"
            >
              Didn&apos;t receive OTP? Resend
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {otpVerified && (
        <div className="max-w-md mx-auto">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-success-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-success-800 font-medium">
                Aadhaar verification completed successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AadhaarVerificationStep
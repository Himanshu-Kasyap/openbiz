import { useState, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import PANInput from './PANInput'
import FormField from './FormField'
import { Button } from '../ui'
import { validators } from '../../utils/validation'
import registrationApi from '../../services/registrationApi'
import locationApi from '../../services/locationApi'
import sessionService from '../../services/sessionService'

/**
 * PANVerificationStep component with personal details
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
const PANVerificationStep = ({
  formData = {},
  onDataChange,
  onStepComplete,
  disabled = false,
  errors = {},
  isLoading = false,
  className
}) => {
  const [isValidating, setIsValidating] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState(null)

  // Handle form field changes
  const handleFieldChange = useCallback((fieldName) => (e) => {
    const value = e.target.value
    onDataChange({
      ...formData,
      [fieldName]: value
    })
    
    // Update session with form data
    sessionService.updateFormData({ [fieldName]: value })
  }, [formData, onDataChange])

  // Handle PIN code change with auto-fill
  const handlePincodeChange = useCallback(async (e) => {
    const pincode = e.target.value
    
    // Update form data
    const updatedData = {
      ...formData,
      pincode,
      // Clear city/state if pincode is being changed
      city: '',
      state: ''
    }
    onDataChange(updatedData)
    sessionService.updateFormData({ pincode, city: '', state: '' })

    // Auto-fill city and state if pincode is valid
    if (validators.isValidPincode && validators.isValidPincode(pincode)) {
      setIsLoadingLocation(true)
      try {
        const locationData = await locationApi.getLocationByPincode(pincode)
        
        if (locationData) {
          const autoFilledData = {
            ...updatedData,
            city: locationData.city,
            state: locationData.state
          }
          
          setLocationSuggestions(locationData)
          onDataChange(autoFilledData)
          sessionService.updateFormData({ 
            city: locationData.city, 
            state: locationData.state 
          })
        }
      } catch (error) {
        console.error('Failed to fetch location data:', error)
        setLocationSuggestions(null)
        // Don't show error to user, just allow manual entry
      } finally {
        setIsLoadingLocation(false)
      }
    } else {
      setLocationSuggestions(null)
    }
  }, [formData, onDataChange])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Validate all required fields
    const requiredFields = ['panNumber', 'fullName', 'dateOfBirth', 'gender', 'mobileNumber']
    const missingFields = requiredFields.filter(field => !formData[field])
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      return
    }

    if (!validators.isValidPAN(formData.panNumber)) {
      console.error('Invalid PAN number')
      return
    }

    // Get session ID
    const sessionId = sessionService.getSessionId()
    if (!sessionId) {
      console.error('No session found. Please start from Step 1.')
      return
    }

    setIsValidating(true)
    try {
      // Prepare personal details
      const personalDetails = {
        firstName: formData.fullName?.split(' ')[0] || '',
        lastName: formData.fullName?.split(' ').slice(1).join(' ') || '',
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        mobileNumber: formData.mobileNumber,
        email: formData.email || '',
        address: {
          street: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || ''
        }
      }

      // Submit Step 2 to backend API
      const response = await registrationApi.submitStep2({
        sessionId,
        panNumber: formData.panNumber,
        personalDetails
      })

      if (response.success) {
        // Update session with completion
        sessionService.updateFormData({ 
          ...formData, 
          stepCompleted: true 
        })
        sessionService.markStepCompleted(1) // Mark step 2 as completed
        
        // Mark step as complete
        if (onStepComplete) {
          onStepComplete({
            ...formData,
            stepCompleted: true,
            registrationStatus: response.status
          })
        }
      } else {
        throw new Error('Step 2 submission failed')
      }
    } catch (error) {
      console.error('Failed to submit step 2:', error)
      
      // Handle specific API errors
      if (error.status === 400) {
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: error.message || 'Invalid data. Please check your information and try again.'
          })
        }
      } else if (error.status === 404) {
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: 'Session not found. Please start from Step 1.'
          })
        }
      } else if (error.name === 'ApiError') {
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: error.message || 'Submission failed. Please try again.'
          })
        }
      } else {
        if (onDataChange) {
          onDataChange({
            ...formData,
            error: 'Network error. Please check your connection and try again.'
          })
        }
      }
    } finally {
      setIsValidating(false)
    }
  }, [formData, onStepComplete, onDataChange])

  const isPanValid = validators.isValidPAN(formData.panNumber || '')
  const isFormValid = isPanValid && 
    formData.fullName && 
    formData.dateOfBirth && 
    formData.gender &&
    formData.mobileNumber &&
    formData.pincode &&
    formData.city &&
    formData.state

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Step header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          PAN & Personal Details
        </h2>
        <p className="text-gray-600">
          Provide your PAN number and complete your personal information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
        {/* PAN Number */}
        <PANInput
          value={formData.panNumber || ''}
          onChange={handleFieldChange('panNumber')}
          error={errors.panNumber}
          disabled={disabled}
          required
        />

        {/* Full Name */}
        <FormField
          label="Full Name"
          error={errors.fullName}
          helpText="Enter your full name as per PAN card"
          required
          disabled={disabled}
        >
          {({ id, error: hasError }) => (
            <input
              id={id}
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName || ''}
              onChange={handleFieldChange('fullName')}
              disabled={disabled}
              className={clsx(
                'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                'transition-colors duration-200',
                hasError
                  ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
              )}
            />
          )}
        </FormField>

        {/* Date of Birth */}
        <FormField
          label="Date of Birth"
          error={errors.dateOfBirth}
          helpText="Enter your date of birth as per PAN card"
          required
          disabled={disabled}
        >
          {({ id, error: hasError }) => (
            <input
              id={id}
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={handleFieldChange('dateOfBirth')}
              disabled={disabled}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              className={clsx(
                'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                'transition-colors duration-200',
                hasError
                  ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
              )}
            />
          )}
        </FormField>

        {/* Gender */}
        <FormField
          label="Gender"
          error={errors.gender}
          required
          disabled={disabled}
        >
          {({ id, error: hasError }) => (
            <select
              id={id}
              value={formData.gender || ''}
              onChange={handleFieldChange('gender')}
              disabled={disabled}
              className={clsx(
                'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'transition-colors duration-200',
                hasError
                  ? 'border-error-300 text-error-900 focus:ring-error-500 focus:border-error-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
              )}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          )}
        </FormField>

        {/* Mobile Number */}
        <FormField
          label="Mobile Number"
          error={errors.mobileNumber}
          helpText="Enter your 10-digit mobile number"
          required
          disabled={disabled}
        >
          {({ id, error: hasError }) => (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 text-sm">+91</span>
              </div>
              <input
                id={id}
                type="tel"
                inputMode="numeric"
                placeholder="Enter mobile number"
                value={formData.mobileNumber || ''}
                onChange={handleFieldChange('mobileNumber')}
                disabled={disabled}
                maxLength={10}
                className={clsx(
                  'block w-full pl-12 pr-3 py-2 text-sm border rounded-md shadow-sm',
                  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'transition-colors duration-200',
                  hasError
                    ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                  disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
                )}
              />
            </div>
          )}
        </FormField>

        {/* Email Address */}
        <FormField
          label="Email Address"
          error={errors.email}
          helpText="Enter your email address for communication"
          disabled={disabled}
        >
          {({ id, error: hasError }) => (
            <input
              id={id}
              type="email"
              placeholder="Enter email address"
              value={formData.email || ''}
              onChange={handleFieldChange('email')}
              disabled={disabled}
              className={clsx(
                'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                'transition-colors duration-200',
                hasError
                  ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
              )}
            />
          )}
        </FormField>

        {/* Address Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Address Details</h3>
          
          {/* PIN Code with auto-fill */}
          <FormField
            label="PIN Code"
            error={errors.pincode}
            helpText="Enter 6-digit PIN code for auto-fill of city and state"
            required
            disabled={disabled}
          >
            {({ id, error: hasError }) => (
              <div className="relative">
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter PIN code"
                  value={formData.pincode || ''}
                  onChange={handlePincodeChange}
                  disabled={disabled}
                  maxLength={6}
                  className={clsx(
                    'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                    'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'transition-colors duration-200',
                    hasError
                      ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                      : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                    disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
                  )}
                />
                {isLoadingLocation && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
            )}
          </FormField>

          {/* Location suggestions */}
          {locationSuggestions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-blue-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  Auto-filled: {locationSuggestions.city}, {locationSuggestions.state}
                </p>
              </div>
            </div>
          )}

          {/* City */}
          <FormField
            label="City"
            error={errors.city}
            required
            disabled={disabled}
          >
            {({ id, error: hasError }) => (
              <input
                id={id}
                type="text"
                placeholder="Enter city name"
                value={formData.city || ''}
                onChange={handleFieldChange('city')}
                disabled={disabled}
                className={clsx(
                  'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'transition-colors duration-200',
                  hasError
                    ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                  disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
                )}
              />
            )}
          </FormField>

          {/* State */}
          <FormField
            label="State"
            error={errors.state}
            required
            disabled={disabled}
          >
            {({ id, error: hasError }) => (
              <input
                id={id}
                type="text"
                placeholder="Enter state name"
                value={formData.state || ''}
                onChange={handleFieldChange('state')}
                disabled={disabled}
                className={clsx(
                  'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'transition-colors duration-200',
                  hasError
                    ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                  disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
                )}
              />
            )}
          </FormField>

          {/* Street Address */}
          <FormField
            label="Street Address"
            error={errors.address}
            helpText="Enter your complete street address"
            disabled={disabled}
          >
            {({ id, error: hasError }) => (
              <textarea
                id={id}
                rows={3}
                placeholder="Enter street address"
                value={formData.address || ''}
                onChange={handleFieldChange('address')}
                disabled={disabled}
                className={clsx(
                  'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
                  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'transition-colors duration-200 resize-none',
                  hasError
                    ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                  disabled && 'bg-gray-50 cursor-not-allowed text-gray-500'
                )}
              />
            )}
          </FormField>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={!isFormValid || disabled}
            loading={isValidating}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Complete Step 2
          </Button>
        </div>
      </form>

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

export default PANVerificationStep
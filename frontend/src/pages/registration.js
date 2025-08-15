import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import Container from '@/components/ui/Container'
import { Card } from '@/components/ui'
import {
  ProgressTracker,
  AadhaarVerificationStep,
  PANVerificationStep,
  FormNavigation
} from '@/components/forms'
import ErrorBoundary from '@/components/ErrorBoundary'
import sessionService from '@/services/sessionService'
import registrationApi from '@/services/registrationApi'

/**
 * Multi-step Udyam registration form page
 * @returns {JSX.Element}
 */
export default function Registration() {
  const router = useRouter()
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1 data
    aadhaarNumber: '',
    otp: '',
    
    // Step 2 data
    panNumber: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    mobileNumber: '',
    email: '',
    pincode: '',
    city: '',
    state: '',
    address: ''
  })
  
  const [completedSteps, setCompletedSteps] = useState([false, false])
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  // Initialize from session and URL query params
  useEffect(() => {
    // Load existing session if available
    const existingSession = sessionService.loadSession()
    if (existingSession) {
      setFormData(existingSession.formData)
      setCurrentStep(existingSession.currentStep)
      setCompletedSteps(existingSession.completedSteps)
      setSessionId(existingSession.sessionId)
    }

    // Override with URL query params if available
    if (router.query.step) {
      const step = parseInt(router.query.step, 10)
      if (step >= 1 && step <= 2) {
        setCurrentStep(step)
      }
    }
  }, [router.query.step])

  // Update URL when step changes
  useEffect(() => {
    const url = `/registration?step=${currentStep}`
    router.replace(url, undefined, { shallow: true })
  }, [currentStep, router])

  // Handle form data changes
  const handleDataChange = useCallback((newData) => {
    setFormData(newData)
    
    // Update session with new data
    sessionService.updateFormData(newData)
    
    // Update session ID if provided
    if (newData.sessionId && newData.sessionId !== sessionId) {
      setSessionId(newData.sessionId)
    }
    
    // Clear errors for changed fields
    const changedFields = Object.keys(newData).filter(
      key => newData[key] !== formData[key]
    )
    if (changedFields.length > 0) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        changedFields.forEach(field => {
          delete newErrors[field]
        })
        return newErrors
      })
    }

    // Handle error display
    if (newData.error) {
      setErrors(prevErrors => ({
        ...prevErrors,
        submit: newData.error
      }))
    }
  }, [formData, sessionId])

  // Handle step completion
  const handleStepComplete = useCallback((stepData) => {
    setFormData(stepData)
    
    // Update session ID if provided
    if (stepData.sessionId) {
      setSessionId(stepData.sessionId)
    }
    
    // Mark current step as completed
    setCompletedSteps(prev => {
      const newCompleted = [...prev]
      newCompleted[currentStep - 1] = true
      
      // Update session with completion status
      sessionService.saveSession({
        sessionId: stepData.sessionId || sessionId,
        currentStep: currentStep < 2 ? currentStep + 1 : currentStep,
        formData: stepData,
        completedSteps: newCompleted
      })
      
      return newCompleted
    })
    
    // Auto-advance to next step if not on last step
    if (currentStep < 2) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 1000)
    } else {
      // Registration completed, redirect to success page
      setTimeout(() => {
        router.push('/registration/success')
      }, 2000)
    }
  }, [currentStep, sessionId, router])

  // Handle navigation
  const handleNext = useCallback(() => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      // Handle final submission
      handleFinalSubmission()
    }
  }, [currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Handle final form submission
  const handleFinalSubmission = useCallback(async () => {
    if (!completedSteps[1]) {
      // Step 2 not completed, don't submit
      return
    }

    setIsLoading(true)
    try {
      // Check registration status
      if (sessionId) {
        const status = await registrationApi.getRegistrationStatus(sessionId)
        if (status.status === 'completed') {
          // Already completed, redirect to success
          router.push('/registration/success')
          return
        }
      }
      
      // Clear session after successful completion
      sessionService.clearSession()
      
      // Redirect to success page
      router.push('/registration/success')
    } catch (error) {
      console.error('Failed to submit registration:', error)
      setErrors({ submit: 'Failed to submit registration. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }, [router, sessionId, completedSteps])

  // Determine if user can proceed to next step
  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return completedSteps[0] // Aadhaar verification completed
      case 2:
        return completedSteps[1] // PAN verification completed
      default:
        return false
    }
  }, [currentStep, completedSteps])

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <AadhaarVerificationStep
            formData={formData}
            onDataChange={handleDataChange}
            onStepComplete={handleStepComplete}
            errors={errors}
            isLoading={isLoading}
          />
        )
      case 2:
        return (
          <PANVerificationStep
            formData={formData}
            onDataChange={handleDataChange}
            onStepComplete={handleStepComplete}
            errors={errors}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  return (
    <Layout title="Udyam Registration - Complete Your Application">
      <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
        <Container className="py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Udyam Registration
              </h1>
              <p className="text-gray-600">
                Complete your micro, small, or medium enterprise registration
              </p>
              {sessionId && (
                <p className="text-xs text-gray-500 mt-2">
                  Session: {sessionId.slice(-8)}
                </p>
              )}
            </div>

            {/* Progress tracker */}
            <div className="mb-8">
              <ProgressTracker
                currentStep={currentStep}
                completedSteps={completedSteps}
              />
            </div>

            {/* Main form card */}
            <ErrorBoundary level="component">
              <Card className="mb-8">
                <div className="card-body relative min-h-[500px]">
                  {renderStepContent()}
                </div>
              </Card>
            </ErrorBoundary>

            {/* Navigation */}
            <div className="max-w-lg mx-auto">
              <FormNavigation
                currentStep={currentStep}
                totalSteps={2}
                completedSteps={completedSteps}
                onPrevious={handlePrevious}
                onNext={handleNext}
                canGoNext={canGoNext()}
                canGoPrevious={currentStep > 1}
                isLoading={isLoading}
              />
            </div>

            {/* Error display */}
            {errors.submit && (
              <div className="mt-6 max-w-lg mx-auto">
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-error-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-error-800">{errors.submit}</p>
                  </div>
                  <button
                    onClick={() => setErrors(prev => ({ ...prev, submit: null }))}
                    className="mt-2 text-xs text-error-600 hover:text-error-500 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Help section */}
            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Technical Support
                  </h4>
                  <p className="text-sm text-gray-600">
                    Having trouble with the form? Contact our technical support team.
                  </p>
                  <a
                    href="mailto:support@udyam.gov.in"
                    className="text-sm text-primary-600 hover:text-primary-500 mt-2 inline-block"
                  >
                    support@udyam.gov.in
                  </a>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Registration Guide
                  </h4>
                  <p className="text-sm text-gray-600">
                    Step-by-step instructions for completing your registration.
                  </p>
                  <a
                    href="/help"
                    className="text-sm text-primary-600 hover:text-primary-500 mt-2 inline-block"
                  >
                    View Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </ErrorBoundary>
    </Layout>
  )
}
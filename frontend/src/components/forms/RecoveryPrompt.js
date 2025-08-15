/**
 * @fileoverview Recovery prompt component for form data recovery
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { useState } from 'react'
import { clsx } from 'clsx'
import { Button } from '../ui'
import ErrorMessage from '../ui/ErrorMessage'

/**
 * @typedef {Object} RecoveryPromptProps
 * @property {Object} recoveryData - Recovery data information
 * @property {number} recoveryData.step - Step number
 * @property {number} recoveryData.ageMinutes - Age in minutes
 * @property {number} recoveryData.formFields - Number of form fields
 * @property {boolean} recoveryData.hasData - Whether recovery data exists
 * @property {function(Object): void} onRecover - Recovery acceptance handler
 * @property {function(): void} onDiscard - Recovery discard handler
 * @property {function(): void} [onClose] - Close handler
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Recovery prompt component
 * @param {RecoveryPromptProps} props
 * @returns {JSX.Element}
 */
const RecoveryPrompt = ({
  recoveryData,
  onRecover,
  onDiscard,
  onClose,
  className,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRecover = async () => {
    setIsProcessing(true)
    try {
      await onRecover(recoveryData)
    } catch (error) {
      console.error('Recovery failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDiscard = async () => {
    setIsProcessing(true)
    try {
      await onDiscard()
    } catch (error) {
      console.error('Discard failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getTimeAgoText = (minutes) => {
    if (minutes < 1) {
      return 'just now'
    } else if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    } else {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours === 1 ? '' : 's'} ago`
    }
  }

  const getStepText = (step) => {
    switch (step) {
      case 0:
      case 1:
        return 'Aadhaar Verification'
      case 2:
        return 'PAN & Personal Details'
      default:
        return `Step ${step}`
    }
  }

  if (!recoveryData || !recoveryData.hasData) {
    return null
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50',
        className
      )}
      {...props}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Recover Previous Session
            </h3>
            <p className="text-sm text-gray-500">
              We found unsaved form data from your previous session
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Recovery details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Last saved:</span>
              <span className="text-blue-600">
                {getTimeAgoText(recoveryData.ageMinutes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Step:</span>
              <span className="text-blue-600">
                {getStepText(recoveryData.step)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Fields completed:</span>
              <span className="text-blue-600">
                {recoveryData.formFields} field{recoveryData.formFields === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Warning message */}
        <ErrorMessage
          variant="info"
          size="sm"
          showIcon={true}
          className="mb-6"
          message="Recovering your previous session will replace any data you've entered in the current session."
        />

        {/* Action buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleRecover}
            disabled={isProcessing}
            loading={isProcessing}
            variant="primary"
            size="md"
            className="flex-1"
          >
            Recover Data
          </Button>
          <Button
            onClick={handleDiscard}
            disabled={isProcessing}
            variant="outline"
            size="md"
            className="flex-1"
          >
            Start Fresh
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Your data is stored locally and will be automatically cleared after 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for managing recovery prompt state
 * @param {Object} options - Hook options
 * @param {function(): Object|null} options.getRecoveryData - Function to get recovery data
 * @param {function(Object): void} options.onRecover - Recovery handler
 * @param {function(): void} options.onDiscard - Discard handler
 * @returns {Object} Recovery prompt state and functions
 */
export const useRecoveryPrompt = ({
  getRecoveryData,
  onRecover,
  onDiscard
}) => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [recoveryData, setRecoveryData] = useState(null)

  const checkForRecoveryData = useCallback(() => {
    const data = getRecoveryData()
    if (data && data.hasData) {
      setRecoveryData(data)
      setShowPrompt(true)
      return true
    }
    return false
  }, [getRecoveryData])

  const handleRecover = useCallback(async (data) => {
    try {
      await onRecover(data)
      setShowPrompt(false)
      setRecoveryData(null)
    } catch (error) {
      console.error('Recovery failed:', error)
      throw error
    }
  }, [onRecover])

  const handleDiscard = useCallback(async () => {
    try {
      await onDiscard()
      setShowPrompt(false)
      setRecoveryData(null)
    } catch (error) {
      console.error('Discard failed:', error)
      throw error
    }
  }, [onDiscard])

  const hidePrompt = useCallback(() => {
    setShowPrompt(false)
    setRecoveryData(null)
  }, [])

  return {
    showPrompt,
    recoveryData,
    checkForRecoveryData,
    handleRecover,
    handleDiscard,
    hidePrompt
  }
}

export default RecoveryPrompt
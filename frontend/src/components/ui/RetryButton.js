/**
 * @fileoverview Retry button component with exponential backoff and retry logic
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import Button from './Button'
import LoadingSpinner from './LoadingSpinner'

/**
 * @typedef {Object} RetryButtonProps
 * @property {function(): Promise<any>} onRetry - Retry function
 * @property {number} [maxRetries=3] - Maximum number of retries
 * @property {number} [initialDelay=1000] - Initial delay in milliseconds
 * @property {number} [backoffMultiplier=2] - Backoff multiplier for exponential backoff
 * @property {string} [children='Retry'] - Button text
 * @property {'primary'|'secondary'|'outline'} [variant='primary'] - Button variant
 * @property {'sm'|'md'|'lg'} [size='md'] - Button size
 * @property {boolean} [disabled=false] - Whether button is disabled
 * @property {string} [className] - Additional CSS classes
 * @property {function(number): void} [onRetryAttempt] - Callback for retry attempts
 * @property {function(Error): void} [onRetryFailed] - Callback for retry failures
 * @property {function(): void} [onRetrySuccess] - Callback for retry success
 */

/**
 * Retry button component with exponential backoff
 * @param {RetryButtonProps} props
 * @returns {JSX.Element}
 */
const RetryButton = ({
  onRetry,
  maxRetries = 3,
  initialDelay = 1000,
  backoffMultiplier = 2,
  children = 'Retry',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  onRetryAttempt,
  onRetryFailed,
  onRetrySuccess,
  ...props
}) => {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(0)

  const sleep = useCallback((ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }, [])

  const handleRetry = useCallback(async () => {
    if (isRetrying || disabled || retryCount >= maxRetries) {
      return
    }

    setIsRetrying(true)
    const currentAttempt = retryCount + 1

    try {
      // Call retry attempt callback
      if (onRetryAttempt) {
        onRetryAttempt(currentAttempt)
      }

      // If this is not the first retry, add delay with countdown
      if (currentAttempt > 1) {
        const delay = initialDelay * Math.pow(backoffMultiplier, currentAttempt - 2)
        let remainingTime = Math.ceil(delay / 1000)
        
        setCountdown(remainingTime)
        
        const countdownInterval = setInterval(() => {
          remainingTime -= 1
          setCountdown(remainingTime)
          
          if (remainingTime <= 0) {
            clearInterval(countdownInterval)
            setCountdown(0)
          }
        }, 1000)

        await sleep(delay)
        clearInterval(countdownInterval)
        setCountdown(0)
      }

      // Execute retry function
      await onRetry()
      
      // Success - reset retry count
      setRetryCount(0)
      
      if (onRetrySuccess) {
        onRetrySuccess()
      }
    } catch (error) {
      console.error(`Retry attempt ${currentAttempt} failed:`, error)
      
      setRetryCount(currentAttempt)
      
      if (onRetryFailed) {
        onRetryFailed(error)
      }
    } finally {
      setIsRetrying(false)
    }
  }, [
    isRetrying,
    disabled,
    retryCount,
    maxRetries,
    onRetry,
    initialDelay,
    backoffMultiplier,
    onRetryAttempt,
    onRetryFailed,
    onRetrySuccess,
    sleep
  ])

  const isMaxRetriesReached = retryCount >= maxRetries
  const isButtonDisabled = disabled || isRetrying || isMaxRetriesReached

  const getButtonText = () => {
    if (countdown > 0) {
      return `Retry in ${countdown}s`
    }
    
    if (isRetrying && countdown === 0) {
      return 'Retrying...'
    }
    
    if (isMaxRetriesReached) {
      return 'Max retries reached'
    }
    
    if (retryCount > 0) {
      return `Retry (${retryCount}/${maxRetries})`
    }
    
    return children
  }

  return (
    <div className={clsx('flex flex-col items-center space-y-2', className)}>
      <Button
        onClick={handleRetry}
        disabled={isButtonDisabled}
        variant={isMaxRetriesReached ? 'outline' : variant}
        size={size}
        className="min-w-[120px]"
        {...props}
      >
        {(isRetrying && countdown === 0) && (
          <LoadingSpinner size="sm" color="white" className="mr-2" />
        )}
        {getButtonText()}
      </Button>
      
      {retryCount > 0 && !isMaxRetriesReached && (
        <p className="text-xs text-gray-500 text-center">
          {maxRetries - retryCount} attempts remaining
        </p>
      )}
      
      {isMaxRetriesReached && (
        <p className="text-xs text-error-600 text-center">
          Please refresh the page or contact support if the problem persists
        </p>
      )}
    </div>
  )
}

/**
 * Hook for retry logic with exponential backoff
 * @param {function(): Promise<any>} asyncFunction - Function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.initialDelay=1000] - Initial delay in milliseconds
 * @param {number} [options.backoffMultiplier=2] - Backoff multiplier
 * @returns {Object} Retry state and functions
 */
export const useRetry = (
  asyncFunction,
  {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2
  } = {}
) => {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState(null)

  const sleep = useCallback((ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }, [])

  const retry = useCallback(async () => {
    if (isRetrying || retryCount >= maxRetries) {
      return
    }

    setIsRetrying(true)
    setError(null)

    let currentAttempt = 0
    let lastError = null

    while (currentAttempt <= maxRetries) {
      try {
        const result = await asyncFunction()
        setRetryCount(0)
        setIsRetrying(false)
        return result
      } catch (err) {
        lastError = err
        currentAttempt++
        
        if (currentAttempt <= maxRetries) {
          const delay = initialDelay * Math.pow(backoffMultiplier, currentAttempt - 1)
          await sleep(delay)
        }
      }
    }

    setRetryCount(currentAttempt)
    setError(lastError)
    setIsRetrying(false)
    throw lastError
  }, [asyncFunction, isRetrying, retryCount, maxRetries, initialDelay, backoffMultiplier, sleep])

  const reset = useCallback(() => {
    setRetryCount(0)
    setError(null)
    setIsRetrying(false)
  }, [])

  return {
    retry,
    reset,
    isRetrying,
    retryCount,
    error,
    canRetry: retryCount < maxRetries && !isRetrying,
    isMaxRetriesReached: retryCount >= maxRetries
  }
}

export default RetryButton
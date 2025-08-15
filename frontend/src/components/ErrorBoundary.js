/**
 * @fileoverview Enhanced error boundary component for graceful error handling
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import React from 'react'
import { Button } from './ui'

/**
 * @typedef {Object} ErrorInfo
 * @property {string} componentStack
 */

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError
 * @property {Error|null} error
 * @property {ErrorInfo|null} errorInfo
 * @property {string|null} errorId
 * @property {number} retryCount
 */

/**
 * Error boundary component for catching and handling React errors
 */
class ErrorBoundary extends React.Component {
  /**
   * @param {Object} props
   * @param {React.ReactNode} props.children
   * @param {React.ComponentType} [props.fallback]
   * @param {function(Error, ErrorInfo): void} [props.onError]
   * @param {boolean} [props.showDetails=false]
   * @param {number} [props.maxRetries=3]
   * @param {string} [props.level='component'] - 'component' | 'page' | 'app'
   */
  constructor(props) {
    super(props)
    
    /** @type {ErrorBoundaryState} */
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    }
  }

  /**
   * Update state when an error is caught
   * @param {Error} error
   * @returns {ErrorBoundaryState}
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Handle component error
   * @param {Error} error
   * @param {ErrorInfo} errorInfo
   */
  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo
    })

    // Log error details
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  /**
   * Report error to monitoring service
   * @param {Error} error
   * @param {ErrorInfo} errorInfo
   */
  reportError = (error, errorInfo) => {
    try {
      // In a real application, you would send this to your error monitoring service
      // e.g., Sentry, LogRocket, Bugsnag, etc.
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId,
        level: this.props.level || 'component',
        retryCount: this.state.retryCount
      }

      console.log('Error report:', errorReport)
      
      // Example: Send to monitoring service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  /**
   * Reset error boundary state
   */
  handleReset = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  /**
   * Reload the page
   */
  handleReload = () => {
    window.location.reload()
  }

  /**
   * Go back to home page
   */
  handleGoHome = () => {
    window.location.href = '/'
  }

  /**
   * Get error type for better user messaging
   * @param {Error} error
   * @returns {string}
   */
  getErrorType = (error) => {
    if (error.name === 'ChunkLoadError') {
      return 'chunk_load'
    }
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'network'
    }
    if (error.message.includes('API') || error.message.includes('400') || error.message.includes('500')) {
      return 'api'
    }
    return 'unknown'
  }

  /**
   * Get user-friendly error message
   * @param {Error} error
   * @returns {string}
   */
  getUserFriendlyMessage = (error) => {
    const errorType = this.getErrorType(error)
    
    switch (errorType) {
      case 'chunk_load':
        return 'The application needs to be refreshed. This usually happens after an update.'
      case 'network':
        return 'There seems to be a network connectivity issue. Please check your internet connection.'
      case 'api':
        return 'We\'re experiencing some technical difficulties. Please try again in a moment.'
      default:
        return 'Something unexpected happened. We\'ve been notified and are working to fix it.'
    }
  }

  /**
   * Render error fallback UI
   */
  renderErrorFallback = () => {
    const { error, errorId, retryCount } = this.state
    const { showDetails = false, maxRetries = 3, level = 'component' } = this.props
    const errorType = this.getErrorType(error)
    const userMessage = this.getUserFriendlyMessage(error)
    const canRetry = retryCount < maxRetries

    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Error icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100 mb-6">
            <svg
              className="h-8 w-8 text-error-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {level === 'app' ? 'Application Error' : 'Something went wrong'}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {userMessage}
          </p>

          {/* Error ID for support */}
          {errorId && (
            <p className="text-xs text-gray-500 mb-6">
              Error ID: {errorId}
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {canRetry && errorType !== 'chunk_load' && (
              <Button
                onClick={this.handleReset}
                variant="primary"
                size="md"
                className="w-full"
              >
                Try Again
              </Button>
            )}

            {errorType === 'chunk_load' || !canRetry ? (
              <Button
                onClick={this.handleReload}
                variant="primary"
                size="md"
                className="w-full"
              >
                Refresh Page
              </Button>
            ) : (
              <Button
                onClick={this.handleReload}
                variant="secondary"
                size="md"
                className="w-full"
              >
                Refresh Page
              </Button>
            )}

            {level !== 'app' && (
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                size="md"
                className="w-full"
              >
                Go to Home
              </Button>
            )}
          </div>

          {/* Technical details (development only) */}
          {showDetails && process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Help section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              Need help? Contact our support team:
            </p>
            <a
              href="mailto:support@udyam.gov.in"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              support@udyam.gov.in
            </a>
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.handleReset}
          />
        )
      }

      // Use default fallback UI
      return this.renderErrorFallback()
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 * @param {React.ComponentType} Component
 * @param {Object} errorBoundaryProps
 * @returns {React.ComponentType}
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

/**
 * Hook for handling async errors in functional components
 * @returns {function(Error): void}
 */
export const useErrorHandler = () => {
  return (error) => {
    // Throw error to be caught by nearest error boundary
    throw error
  }
}

export default ErrorBoundary
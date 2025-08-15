/**
 * @fileoverview Error message component for displaying user-friendly error messages
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { clsx } from 'clsx'

/**
 * @typedef {Object} ErrorMessageProps
 * @property {string} message - Error message to display
 * @property {'error'|'warning'|'info'} [variant='error'] - Error message variant
 * @property {'sm'|'md'|'lg'} [size='md'] - Error message size
 * @property {boolean} [dismissible=false] - Whether error can be dismissed
 * @property {function} [onDismiss] - Dismiss handler
 * @property {boolean} [showIcon=true] - Whether to show error icon
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Additional content
 */

/**
 * Error message component for displaying user-friendly error messages
 * @param {ErrorMessageProps} props
 * @returns {JSX.Element}
 */
const ErrorMessage = ({
  message,
  variant = 'error',
  size = 'md',
  dismissible = false,
  onDismiss,
  showIcon = true,
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    error: {
      container: 'bg-error-50 border-error-200 text-error-800',
      icon: 'text-error-600',
      button: 'text-error-600 hover:text-error-800'
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: 'text-warning-600',
      button: 'text-warning-600 hover:text-warning-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      button: 'text-blue-600 hover:text-blue-800'
    }
  }

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-5 text-base'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg
            className={clsx(iconSizeClasses[size], variantClasses[variant].icon)}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'info':
        return (
          <svg
            className={clsx(iconSizeClasses[size], variantClasses[variant].icon)}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
        )
      default: // error
        return (
          <svg
            className={clsx(iconSizeClasses[size], variantClasses[variant].icon)}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        )
    }
  }

  if (!message && !children) {
    return null
  }

  return (
    <div
      className={clsx(
        'border rounded-md',
        variantClasses[variant].container,
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
        )}
        
        <div className={clsx('flex-1', showIcon && 'ml-3')}>
          {message && (
            <p className="font-medium">
              {message}
            </p>
          )}
          {children && (
            <div className={message ? 'mt-2' : ''}>
              {children}
            </div>
          )}
        </div>

        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                variantClasses[variant].button,
                variant === 'error' && 'focus:ring-error-600 focus:ring-offset-error-50',
                variant === 'warning' && 'focus:ring-warning-600 focus:ring-offset-warning-50',
                variant === 'info' && 'focus:ring-blue-600 focus:ring-offset-blue-50'
              )}
              aria-label="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
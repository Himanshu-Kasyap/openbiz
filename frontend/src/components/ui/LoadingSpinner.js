/**
 * @fileoverview Loading spinner component with various sizes and styles
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { clsx } from 'clsx'

/**
 * @typedef {Object} LoadingSpinnerProps
 * @property {'sm'|'md'|'lg'|'xl'} [size='md'] - Spinner size
 * @property {'primary'|'secondary'|'white'} [color='primary'] - Spinner color
 * @property {string} [className] - Additional CSS classes
 * @property {string} [label] - Accessible label for screen readers
 */

/**
 * Loading spinner component
 * @param {LoadingSpinnerProps} props
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading...',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white'
  }

  return (
    <div
      className={clsx('inline-block', className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <svg
        className={clsx(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Full-screen loading overlay component
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Loading message
 * @param {boolean} [props.transparent=false] - Whether overlay is transparent
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export const LoadingOverlay = ({
  message = 'Loading...',
  transparent = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        transparent ? 'bg-black bg-opacity-25' : 'bg-white bg-opacity-90',
        className
      )}
      {...props}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-sm text-gray-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Inline loading state component
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Loading message
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Component size
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export const InlineLoading = ({
  message = 'Loading...',
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-8'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center space-x-2',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
      <span className={clsx('text-gray-600', textSizeClasses[size])}>
        {message}
      </span>
    </div>
  )
}

export default LoadingSpinner
/**
 * @fileoverview Progress indicator component for showing loading progress
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { clsx } from 'clsx'

/**
 * @typedef {Object} ProgressIndicatorProps
 * @property {number} value - Progress value (0-100)
 * @property {number} [max=100] - Maximum value
 * @property {'sm'|'md'|'lg'} [size='md'] - Progress bar size
 * @property {'primary'|'success'|'warning'|'error'} [color='primary'] - Progress bar color
 * @property {boolean} [showLabel=false] - Whether to show progress label
 * @property {string} [label] - Custom label text
 * @property {boolean} [animated=false] - Whether to animate progress
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Progress indicator component
 * @param {ProgressIndicatorProps} props
 * @returns {JSX.Element}
 */
const ProgressIndicator = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  animated = false,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  }

  return (
    <div className={clsx('w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div
        className={clsx(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Circular progress indicator component
 * @param {Object} props
 * @property {number} value - Progress value (0-100)
 * @property {number} [max=100] - Maximum value
 * @property {number} [size=64] - Circle size in pixels
 * @property {number} [strokeWidth=4] - Stroke width
 * @property {'primary'|'success'|'warning'|'error'} [color='primary'] - Progress color
 * @property {boolean} [showLabel=true] - Whether to show percentage label
 * @property {string} [className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export const CircularProgress = ({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  color = 'primary',
  showLabel = true,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const colorClasses = {
    primary: 'stroke-primary-600',
    success: 'stroke-success-600',
    warning: 'stroke-warning-600',
    error: 'stroke-error-600'
  }

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={clsx(
            'transition-all duration-300 ease-out',
            colorClasses[color]
          )}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Step progress indicator component
 * @param {Object} props
 * @property {Array<{label: string, completed: boolean, active?: boolean}>} steps - Steps array
 * @property {'horizontal'|'vertical'} [orientation='horizontal'] - Layout orientation
 * @property {'sm'|'md'|'lg'} [size='md'] - Component size
 * @property {string} [className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export const StepProgress = ({
  steps = [],
  orientation = 'horizontal',
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6 text-xs',
      text: 'text-xs',
      spacing: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4'
    },
    md: {
      circle: 'w-8 h-8 text-sm',
      text: 'text-sm',
      spacing: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6'
    },
    lg: {
      circle: 'w-10 h-10 text-base',
      text: 'text-base',
      spacing: orientation === 'horizontal' ? 'space-x-8' : 'space-y-8'
    }
  }

  const containerClasses = orientation === 'horizontal' 
    ? 'flex items-center' 
    : 'flex flex-col'

  return (
    <div
      className={clsx(
        containerClasses,
        sizeClasses[size].spacing,
        className
      )}
      {...props}
    >
      {steps.map((step, index) => (
        <div
          key={index}
          className={clsx(
            'flex items-center',
            orientation === 'vertical' && 'flex-col text-center'
          )}
        >
          <div
            className={clsx(
              'flex items-center justify-center rounded-full border-2 font-medium',
              sizeClasses[size].circle,
              step.completed
                ? 'bg-success-600 border-success-600 text-white'
                : step.active
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-gray-300 text-gray-500'
            )}
          >
            {step.completed ? (
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          
          {step.label && (
            <span
              className={clsx(
                'font-medium',
                sizeClasses[size].text,
                orientation === 'horizontal' ? 'ml-2' : 'mt-2',
                step.completed || step.active
                  ? 'text-gray-900'
                  : 'text-gray-500'
              )}
            >
              {step.label}
            </span>
          )}
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={clsx(
                orientation === 'horizontal'
                  ? 'flex-1 h-0.5 mx-4'
                  : 'w-0.5 h-8 my-2',
                step.completed
                  ? 'bg-success-600'
                  : 'bg-gray-300'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default ProgressIndicator
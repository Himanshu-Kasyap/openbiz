import { clsx } from 'clsx'
import { forwardRef } from 'react'

/**
 * Reusable FormField component with validation display
 * @param {Object} props
 * @param {React.ReactNode} props.children - Field input element
 * @param {string} [props.label] - Field label
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.id] - Field ID
 * @returns {JSX.Element}
 */
const FormField = forwardRef(({
  children,
  label,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
  id,
  ...props
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={clsx('space-y-1', className)} {...props}>
      {label && (
        <label 
          htmlFor={fieldId} 
          className={clsx(
            'block text-sm font-medium',
            error ? 'text-error-700' : 'text-gray-700',
            disabled && 'text-gray-400'
          )}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {typeof children === 'function' 
          ? children({ id: fieldId, error: !!error, disabled, ref })
          : children
        }
      </div>
      
      {error && (
        <p 
          className="text-sm text-error-600 flex items-center gap-1" 
          role="alert"
          aria-live="polite"
        >
          <svg 
            className="w-4 h-4 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
})

FormField.displayName = 'FormField'

export default FormField
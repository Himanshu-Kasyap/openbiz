import { clsx } from 'clsx'
import { forwardRef } from 'react'

/**
 * Input component with validation states
 * @param {Object} props
 * @param {string} [props.label] - Input label
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {'text'|'email'|'password'|'number'|'tel'} [props.type='text'] - Input type
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Input size
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element}
 */
const Input = forwardRef(({
  label,
  placeholder,
  error,
  helpText,
  required = false,
  disabled = false,
  type = 'text',
  size = 'md',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  const baseClasses = 'block w-full border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  }
  
  const stateClasses = error
    ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500'
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          stateClasses,
          disabled && 'bg-gray-50 cursor-not-allowed'
        )}
        {...props}
      />
      
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="form-help">
          {helpText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
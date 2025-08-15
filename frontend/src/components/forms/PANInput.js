import { forwardRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import FormField from './FormField'
import { validators } from '../../utils/validation'

/**
 * PANInput component with regex pattern validation
 * @param {Object} props
 * @param {string} [props.label='PAN Number'] - Field label
 * @param {string} [props.placeholder='Enter PAN number (e.g., ABCDE1234F)'] - Input placeholder
 * @param {string} [props.value=''] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text
 * @param {boolean} [props.required=true] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {boolean} [props.autoUppercase=true] - Whether to auto-convert to uppercase
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element}
 */
const PANInput = forwardRef(({
  label = 'PAN Number',
  placeholder = 'Enter PAN number (e.g., ABCDE1234F)',
  value = '',
  onChange,
  onBlur,
  error,
  helpText = 'Enter your 10-character PAN number',
  required = true,
  disabled = false,
  autoUppercase = true,
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(value)

  // Handle input change with validation
  const handleChange = useCallback((e) => {
    let inputValue = e.target.value
    
    // Remove spaces and special characters, keep only alphanumeric
    inputValue = inputValue.replace(/[^a-zA-Z0-9]/g, '')
    
    // Limit to 10 characters
    inputValue = inputValue.slice(0, 10)
    
    // Auto-convert to uppercase if enabled
    if (autoUppercase) {
      inputValue = inputValue.toUpperCase()
    }
    
    setInternalValue(inputValue)
    
    if (onChange) {
      // Create synthetic event with processed value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      }
      onChange(syntheticEvent)
    }
  }, [onChange, autoUppercase])

  // Handle blur with validation
  const handleBlur = useCallback((e) => {
    setIsFocused(false)
    if (onBlur) {
      onBlur(e)
    }
  }, [onBlur])

  // Handle focus
  const handleFocus = useCallback((e) => {
    setIsFocused(true)
  }, [])

  // Real-time validation
  const isValid = validators.isValidPAN(internalValue)
  const showValidation = internalValue.length > 0 && !isFocused
  const validationError = showValidation && internalValue.length === 10 && !isValid 
    ? 'Please enter a valid PAN number (Format: ABCDE1234F)'
    : error

  // Format display value with pattern hint
  const getFormattedDisplay = (val) => {
    if (!val) return ''
    
    // Add visual separation for better readability
    if (val.length <= 5) {
      return val
    } else if (val.length <= 9) {
      return `${val.slice(0, 5)}${val.slice(5)}`
    } else {
      return `${val.slice(0, 5)}${val.slice(5, 9)}${val.slice(9)}`
    }
  }

  return (
    <FormField
      label={label}
      error={validationError}
      helpText={helpText}
      required={required}
      disabled={disabled}
      className={className}
    >
      {({ id, error: hasError }) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="text"
            placeholder={placeholder}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            maxLength={10}
            className={clsx(
              'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
              'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-200 font-mono tracking-wider uppercase',
              hasError || validationError
                ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
              disabled && 'bg-gray-50 cursor-not-allowed text-gray-500',
              showValidation && isValid && 'border-success-300 focus:ring-success-500 focus:border-success-500'
            )}
            {...props}
          />
          
          {/* Pattern hint overlay when empty and focused */}
          {isFocused && !internalValue && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-400 font-mono text-sm tracking-wider">
                ABCDE1234F
              </span>
            </div>
          )}
          
          {/* Validation indicator */}
          {showValidation && internalValue.length === 10 && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValid ? (
                <svg 
                  className="w-5 h-5 text-success-500" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              ) : (
                <svg 
                  className="w-5 h-5 text-error-500" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              )}
            </div>
          )}
          
          {/* Character count indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-8">
            <span className={clsx(
              'text-xs font-mono',
              internalValue.length === 10 
                ? isValid ? 'text-success-500' : 'text-error-500'
                : 'text-gray-400'
            )}>
              {internalValue.length}/10
            </span>
          </div>
        </div>
      )}
    </FormField>
  )
})

PANInput.displayName = 'PANInput'

export default PANInput
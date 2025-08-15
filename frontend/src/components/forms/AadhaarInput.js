import { forwardRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import FormField from './FormField'
import { validators } from '../../utils/validation'

/**
 * AadhaarInput component with 12-digit format validation
 * @param {Object} props
 * @param {string} [props.label='Aadhaar Number'] - Field label
 * @param {string} [props.placeholder='Enter 12-digit Aadhaar number'] - Input placeholder
 * @param {string} [props.value=''] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text
 * @param {boolean} [props.required=true] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {boolean} [props.showFormatted=true] - Whether to show formatted display
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element}
 */
const AadhaarInput = forwardRef(({
  label = 'Aadhaar Number',
  placeholder = 'Enter 12-digit Aadhaar number',
  value = '',
  onChange,
  onBlur,
  error,
  helpText = 'Enter your 12-digit Aadhaar number',
  required = true,
  disabled = false,
  showFormatted = true,
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(value)

  // Handle input change with validation
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value
    const cleanedValue = validators.cleanNumeric(rawValue)
    
    // Limit to 12 digits
    const limitedValue = cleanedValue.slice(0, 12)
    
    setInternalValue(limitedValue)
    
    if (onChange) {
      // Create synthetic event with cleaned value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: limitedValue
        }
      }
      onChange(syntheticEvent)
    }
  }, [onChange])

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

  // Get display value (formatted or raw)
  const displayValue = showFormatted && !isFocused && internalValue.length === 12
    ? validators.formatAadhaar(internalValue)
    : internalValue

  // Real-time validation
  const isValid = validators.isValidAadhaar(internalValue)
  const showValidation = internalValue.length > 0 && !isFocused
  const validationError = showValidation && !isValid 
    ? 'Please enter a valid 12-digit Aadhaar number'
    : error

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
            inputMode="numeric"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            maxLength={showFormatted && !isFocused ? 14 : 12} // Account for spaces in formatted display
            className={clsx(
              'block w-full px-3 py-2 text-sm border rounded-md shadow-sm',
              'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-200',
              hasError || validationError
                ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
              disabled && 'bg-gray-50 cursor-not-allowed text-gray-500',
              showValidation && isValid && 'border-success-300 focus:ring-success-500 focus:border-success-500'
            )}
            {...props}
          />
          
          {/* Validation indicator */}
          {showValidation && (
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
        </div>
      )}
    </FormField>
  )
})

AadhaarInput.displayName = 'AadhaarInput'

export default AadhaarInput
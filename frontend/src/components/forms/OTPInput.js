import { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import FormField from './FormField'
import { validators } from '../../utils/validation'

/**
 * OTPInput component with 6-digit numeric validation
 * @param {Object} props
 * @param {string} [props.label='Enter OTP'] - Field label
 * @param {string} [props.placeholder='Enter 6-digit OTP'] - Input placeholder
 * @param {string} [props.value=''] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {function} [props.onComplete] - Called when OTP is complete
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text
 * @param {boolean} [props.required=true] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {boolean} [props.autoFocus=false] - Whether to auto-focus first input
 * @param {boolean} [props.separateInputs=true] - Whether to use separate inputs for each digit
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element}
 */
const OTPInput = forwardRef(({
  label = 'Enter OTP',
  placeholder = 'Enter 6-digit OTP',
  value = '',
  onChange,
  onBlur,
  onComplete,
  error,
  helpText = 'Enter the 6-digit OTP sent to your mobile number',
  required = true,
  disabled = false,
  autoFocus = false,
  separateInputs = true,
  className,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(value)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRefs = useRef([])

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])

  // Auto-focus first input if enabled
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  // Handle value changes from parent
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value)
    }
  }, [value])

  // Handle input change
  const handleChange = useCallback((e, index) => {
    const inputValue = e.target.value
    const cleanedValue = validators.cleanNumeric(inputValue)
    
    if (separateInputs) {
      // Handle separate inputs
      const newValue = internalValue.split('')
      
      if (cleanedValue.length > 1) {
        // Handle paste or multiple characters
        const pastedDigits = cleanedValue.slice(0, 6 - index)
        for (let i = 0; i < pastedDigits.length && index + i < 6; i++) {
          newValue[index + i] = pastedDigits[i]
        }
        
        // Focus next empty input or last input
        const nextIndex = Math.min(index + pastedDigits.length, 5)
        setTimeout(() => {
          if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus()
          }
        }, 0)
      } else {
        // Handle single character
        newValue[index] = cleanedValue
        
        // Auto-focus next input
        if (cleanedValue && index < 5) {
          setTimeout(() => {
            if (inputRefs.current[index + 1]) {
              inputRefs.current[index + 1].focus()
            }
          }, 0)
        }
      }
      
      const finalValue = newValue.join('').slice(0, 6)
      setInternalValue(finalValue)
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: finalValue }
        }
        onChange(syntheticEvent)
      }
      
      // Call onComplete when OTP is complete
      if (finalValue.length === 6 && onComplete) {
        onComplete(finalValue)
      }
    } else {
      // Handle single input
      const limitedValue = cleanedValue.slice(0, 6)
      setInternalValue(limitedValue)
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: limitedValue }
        }
        onChange(syntheticEvent)
      }
      
      // Call onComplete when OTP is complete
      if (limitedValue.length === 6 && onComplete) {
        onComplete(limitedValue)
      }
    }
  }, [internalValue, onChange, onComplete, separateInputs])

  // Handle key down for navigation
  const handleKeyDown = useCallback((e, index) => {
    if (separateInputs) {
      if (e.key === 'Backspace' && !internalValue[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        setTimeout(() => {
          if (inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus()
          }
        }, 0)
      } else if (e.key === 'ArrowLeft' && index > 0) {
        // Move to previous input on left arrow
        setTimeout(() => {
          if (inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus()
          }
        }, 0)
      } else if (e.key === 'ArrowRight' && index < 5) {
        // Move to next input on right arrow
        setTimeout(() => {
          if (inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus()
          }
        }, 0)
      }
    }
  }, [internalValue, separateInputs])

  // Handle focus
  const handleFocus = useCallback((index) => {
    setFocusedIndex(index)
  }, [])

  // Handle blur
  const handleBlur = useCallback((e, index) => {
    setFocusedIndex(-1)
    if (onBlur) {
      onBlur(e)
    }
  }, [onBlur])

  // Real-time validation
  const isValid = validators.isValidOTP(internalValue)
  const showValidation = internalValue.length > 0
  const validationError = showValidation && internalValue.length === 6 && !isValid 
    ? 'Please enter a valid 6-digit OTP'
    : error

  if (separateInputs) {
    return (
      <FormField
        label={label}
        error={validationError}
        helpText={helpText}
        required={required}
        disabled={disabled}
        className={className}
      >
        <div className="flex gap-2 justify-center sm:justify-start">
          {Array.from({ length: 6 }, (_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={internalValue[index] || ''}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={(e) => handleBlur(e, index)}
              disabled={disabled}
              className={clsx(
                'w-12 h-12 text-center text-lg font-semibold border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'transition-colors duration-200',
                validationError
                  ? 'border-error-300 text-error-900 focus:ring-error-500 focus:border-error-500'
                  : focusedIndex === index
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
                disabled && 'bg-gray-50 cursor-not-allowed text-gray-500',
                showValidation && isValid && 'border-success-300'
              )}
              {...props}
            />
          ))}
        </div>
      </FormField>
    )
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
            inputMode="numeric"
            placeholder={placeholder}
            value={internalValue}
            onChange={(e) => handleChange(e, 0)}
            onBlur={(e) => handleBlur(e, 0)}
            onFocus={() => handleFocus(0)}
            disabled={disabled}
            maxLength={6}
            className={clsx(
              'block w-full px-3 py-2 text-sm border rounded-md shadow-sm text-center',
              'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-200 font-mono tracking-widest',
              hasError || validationError
                ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
                : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500',
              disabled && 'bg-gray-50 cursor-not-allowed text-gray-500',
              showValidation && isValid && 'border-success-300 focus:ring-success-500 focus:border-success-500'
            )}
            {...props}
          />
          
          {/* Validation indicator */}
          {showValidation && internalValue.length === 6 && (
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

OTPInput.displayName = 'OTPInput'

export default OTPInput
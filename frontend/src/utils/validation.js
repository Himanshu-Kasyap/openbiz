import * as yup from 'yup'

/**
 * Common validation patterns and schemas
 */

// Regex patterns
export const patterns = {
  aadhaar: /^\d{12}$/,
  pan: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/,
  otp: /^\d{6}$/,
  pincode: /^\d{6}$/,
  mobile: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
}

// Custom validation methods
yup.addMethod(yup.string, 'aadhaar', function (message = 'Invalid Aadhaar number') {
  return this.test('aadhaar', message, function (value) {
    if (!value) return true // Let required handle empty values
    return patterns.aadhaar.test(value)
  })
})

yup.addMethod(yup.string, 'pan', function (message = 'Invalid PAN format') {
  return this.test('pan', message, function (value) {
    if (!value) return true // Let required handle empty values
    return patterns.pan.test(value.toUpperCase())
  })
})

yup.addMethod(yup.string, 'otp', function (message = 'Invalid OTP format') {
  return this.test('otp', message, function (value) {
    if (!value) return true // Let required handle empty values
    return patterns.otp.test(value)
  })
})

yup.addMethod(yup.string, 'pincode', function (message = 'Invalid PIN code') {
  return this.test('pincode', message, function (value) {
    if (!value) return true // Let required handle empty values
    return patterns.pincode.test(value)
  })
})

yup.addMethod(yup.string, 'mobile', function (message = 'Invalid mobile number') {
  return this.test('mobile', message, function (value) {
    if (!value) return true // Let required handle empty values
    return patterns.mobile.test(value)
  })
})

// Common field schemas
export const fieldSchemas = {
  aadhaar: yup
    .string()
    .required('Aadhaar number is required')
    .aadhaar('Please enter a valid 12-digit Aadhaar number'),

  pan: yup
    .string()
    .required('PAN number is required')
    .pan('Please enter a valid PAN number (e.g., ABCDE1234F)'),

  otp: yup
    .string()
    .required('OTP is required')
    .otp('Please enter a valid 6-digit OTP'),

  pincode: yup
    .string()
    .required('PIN code is required')
    .pincode('Please enter a valid 6-digit PIN code'),

  mobile: yup
    .string()
    .required('Mobile number is required')
    .mobile('Please enter a valid 10-digit mobile number'),

  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),

  address: yup
    .string()
    .required('Address is required')
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters'),
}

// Form schemas for different steps
export const step1Schema = yup.object({
  aadhaarNumber: fieldSchemas.aadhaar,
  otp: fieldSchemas.otp,
})

export const step2Schema = yup.object({
  panNumber: fieldSchemas.pan,
  firstName: fieldSchemas.name,
  lastName: fieldSchemas.name,
  email: fieldSchemas.email,
  mobile: fieldSchemas.mobile,
  address: fieldSchemas.address,
  pincode: fieldSchemas.pincode,
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
})

// Complete form schema
export const completeFormSchema = yup.object({
  ...step1Schema.fields,
  ...step2Schema.fields,
})

/**
 * Validation utilities
 */
export const validators = {
  /**
   * Validate Aadhaar number
   * @param {string} aadhaar - Aadhaar number
   * @returns {boolean} Is valid
   */
  isValidAadhaar: (aadhaar) => {
    return patterns.aadhaar.test(aadhaar)
  },

  /**
   * Validate PAN number
   * @param {string} pan - PAN number
   * @returns {boolean} Is valid
   */
  isValidPAN: (pan) => {
    return patterns.pan.test(pan?.toUpperCase())
  },

  /**
   * Validate OTP
   * @param {string} otp - OTP
   * @returns {boolean} Is valid
   */
  isValidOTP: (otp) => {
    return patterns.otp.test(otp)
  },

  /**
   * Validate PIN code
   * @param {string} pincode - PIN code
   * @returns {boolean} Is valid
   */
  isValidPincode: (pincode) => {
    return patterns.pincode.test(pincode)
  },

  /**
   * Format Aadhaar number with spaces
   * @param {string} aadhaar - Aadhaar number
   * @returns {string} Formatted Aadhaar
   */
  formatAadhaar: (aadhaar) => {
    const cleaned = aadhaar.replace(/\D/g, '')
    if (cleaned.length <= 4) {
      return cleaned
    } else if (cleaned.length <= 8) {
      return cleaned.replace(/(\d{4})(\d{1,4})/, '$1 $2')
    } else {
      return cleaned.replace(/(\d{4})(\d{4})(\d{1,4})/, '$1 $2 $3')
    }
  },

  /**
   * Format PAN number to uppercase
   * @param {string} pan - PAN number
   * @returns {string} Formatted PAN
   */
  formatPAN: (pan) => {
    return pan.toUpperCase()
  },

  /**
   * Clean numeric input (remove non-digits)
   * @param {string} value - Input value
   * @returns {string} Cleaned value
   */
  cleanNumeric: (value) => {
    return value.replace(/\D/g, '')
  },
}

export default {
  patterns,
  fieldSchemas,
  step1Schema,
  step2Schema,
  completeFormSchema,
  validators,
}
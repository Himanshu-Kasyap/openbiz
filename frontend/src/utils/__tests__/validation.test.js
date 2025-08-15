import {
  patterns,
  fieldSchemas,
  step1Schema,
  step2Schema,
  completeFormSchema,
  validators
} from '../validation'

describe('Validation Patterns', () => {
  describe('aadhaar pattern', () => {
    it('validates correct 12-digit Aadhaar numbers', () => {
      const validAadhaars = ['123456789012', '000000000000', '999999999999']
      
      validAadhaars.forEach(aadhaar => {
        expect(patterns.aadhaar.test(aadhaar)).toBe(true)
      })
    })

    it('rejects invalid Aadhaar numbers', () => {
      const invalidAadhaars = [
        '12345678901',   // 11 digits
        '1234567890123', // 13 digits
        '12345678901a',  // contains letter
        '123-456-789012', // contains hyphens
        '',              // empty
        '123 456 789 012' // contains spaces
      ]
      
      invalidAadhaars.forEach(aadhaar => {
        expect(patterns.aadhaar.test(aadhaar)).toBe(false)
      })
    })
  })

  describe('pan pattern', () => {
    it('validates correct PAN formats', () => {
      const validPANs = [
        'ABCDE1234F',
        'AAAAA0000A',
        'ZZZZZ9999Z',
        'abcde1234f' // lowercase should work with toUpperCase()
      ]
      
      validPANs.forEach(pan => {
        expect(patterns.pan.test(pan.toUpperCase())).toBe(true)
      })
    })

    it('rejects invalid PAN formats', () => {
      const invalidPANs = [
        '1234567890',    // all numbers
        'ABCDEFGHIJ',    // all letters
        'ABCD1234EF',    // wrong position of numbers
        'ABC1234DEF',    // wrong length
        'ABCDE123F',     // missing digit
        'ABCDE12345',    // missing letter at end
        '',              // empty
        'ABCDE-1234-F'   // contains hyphens
      ]
      
      invalidPANs.forEach(pan => {
        expect(patterns.pan.test(pan)).toBe(false)
      })
    })
  })

  describe('otp pattern', () => {
    it('validates correct 6-digit OTPs', () => {
      const validOTPs = ['123456', '000000', '999999']
      
      validOTPs.forEach(otp => {
        expect(patterns.otp.test(otp)).toBe(true)
      })
    })

    it('rejects invalid OTPs', () => {
      const invalidOTPs = [
        '12345',    // 5 digits
        '1234567',  // 7 digits
        '12345a',   // contains letter
        '',         // empty
        '123 456'   // contains space
      ]
      
      invalidOTPs.forEach(otp => {
        expect(patterns.otp.test(otp)).toBe(false)
      })
    })
  })

  describe('pincode pattern', () => {
    it('validates correct 6-digit PIN codes', () => {
      const validPincodes = ['110001', '400001', '560001']
      
      validPincodes.forEach(pincode => {
        expect(patterns.pincode.test(pincode)).toBe(true)
      })
    })

    it('rejects invalid PIN codes', () => {
      const invalidPincodes = [
        '11001',    // 5 digits
        '1100011',  // 7 digits
        '11001a',   // contains letter
        '',         // empty
        '110-001'   // contains hyphen
      ]
      
      invalidPincodes.forEach(pincode => {
        expect(patterns.pincode.test(pincode)).toBe(false)
      })
    })
  })

  describe('mobile pattern', () => {
    it('validates correct Indian mobile numbers', () => {
      const validMobiles = ['9876543210', '8765432109', '7654321098', '6543210987']
      
      validMobiles.forEach(mobile => {
        expect(patterns.mobile.test(mobile)).toBe(true)
      })
    })

    it('rejects invalid mobile numbers', () => {
      const invalidMobiles = [
        '1234567890',  // doesn't start with 6-9
        '987654321',   // 9 digits
        '98765432101', // 11 digits
        '987654321a',  // contains letter
        '',            // empty
        '987-654-3210' // contains hyphens
      ]
      
      invalidMobiles.forEach(mobile => {
        expect(patterns.mobile.test(mobile)).toBe(false)
      })
    })
  })
})

describe('Validation Utilities', () => {
  describe('isValidAadhaar', () => {
    it('validates Aadhaar numbers correctly', () => {
      expect(validators.isValidAadhaar('123456789012')).toBe(true)
      expect(validators.isValidAadhaar('12345678901')).toBe(false)
      expect(validators.isValidAadhaar('')).toBe(false)
    })
  })

  describe('isValidPAN', () => {
    it('validates PAN numbers correctly', () => {
      expect(validators.isValidPAN('ABCDE1234F')).toBe(true)
      expect(validators.isValidPAN('abcde1234f')).toBe(true) // should handle lowercase
      expect(validators.isValidPAN('1234567890')).toBe(false)
      expect(validators.isValidPAN('')).toBe(false)
    })
  })

  describe('isValidOTP', () => {
    it('validates OTP correctly', () => {
      expect(validators.isValidOTP('123456')).toBe(true)
      expect(validators.isValidOTP('12345')).toBe(false)
      expect(validators.isValidOTP('')).toBe(false)
    })
  })

  describe('isValidPincode', () => {
    it('validates PIN codes correctly', () => {
      expect(validators.isValidPincode('110001')).toBe(true)
      expect(validators.isValidPincode('11001')).toBe(false)
      expect(validators.isValidPincode('')).toBe(false)
    })
  })

  describe('formatAadhaar', () => {
    it('formats Aadhaar numbers with spaces', () => {
      expect(validators.formatAadhaar('123456789012')).toBe('1234 5678 9012')
      expect(validators.formatAadhaar('123456789')).toBe('1234 5678 9')
      expect(validators.formatAadhaar('123')).toBe('123')
    })
  })

  describe('formatPAN', () => {
    it('converts PAN to uppercase', () => {
      expect(validators.formatPAN('abcde1234f')).toBe('ABCDE1234F')
      expect(validators.formatPAN('ABCDE1234F')).toBe('ABCDE1234F')
    })
  })

  describe('cleanNumeric', () => {
    it('removes non-numeric characters', () => {
      expect(validators.cleanNumeric('abc123def456')).toBe('123456')
      expect(validators.cleanNumeric('123-456-789')).toBe('123456789')
      expect(validators.cleanNumeric('123 456 789')).toBe('123456789')
      expect(validators.cleanNumeric('abcdef')).toBe('')
    })
  })
})

describe('Field Schemas', () => {
  describe('aadhaar schema', () => {
    it('validates correct Aadhaar numbers', async () => {
      await expect(fieldSchemas.aadhaar.validate('123456789012')).resolves.toBe('123456789012')
    })

    it('rejects invalid Aadhaar numbers', async () => {
      await expect(fieldSchemas.aadhaar.validate('12345678901')).rejects.toThrow()
      await expect(fieldSchemas.aadhaar.validate('')).rejects.toThrow()
    })
  })

  describe('pan schema', () => {
    it('validates correct PAN numbers', async () => {
      await expect(fieldSchemas.pan.validate('ABCDE1234F')).resolves.toBe('ABCDE1234F')
    })

    it('rejects invalid PAN numbers', async () => {
      await expect(fieldSchemas.pan.validate('1234567890')).rejects.toThrow()
      await expect(fieldSchemas.pan.validate('')).rejects.toThrow()
    })
  })

  describe('otp schema', () => {
    it('validates correct OTPs', async () => {
      await expect(fieldSchemas.otp.validate('123456')).resolves.toBe('123456')
    })

    it('rejects invalid OTPs', async () => {
      await expect(fieldSchemas.otp.validate('12345')).rejects.toThrow()
      await expect(fieldSchemas.otp.validate('')).rejects.toThrow()
    })
  })

  describe('mobile schema', () => {
    it('validates correct mobile numbers', async () => {
      await expect(fieldSchemas.mobile.validate('9876543210')).resolves.toBe('9876543210')
    })

    it('rejects invalid mobile numbers', async () => {
      await expect(fieldSchemas.mobile.validate('1234567890')).rejects.toThrow()
      await expect(fieldSchemas.mobile.validate('')).rejects.toThrow()
    })
  })

  describe('email schema', () => {
    it('validates correct email addresses', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.in']
      
      for (const email of validEmails) {
        await expect(fieldSchemas.email.validate(email)).resolves.toBe(email)
      }
    })

    it('rejects invalid email addresses', async () => {
      const invalidEmails = ['invalid-email', 'test@', '@domain.com', '']
      
      for (const email of invalidEmails) {
        await expect(fieldSchemas.email.validate(email)).rejects.toThrow()
      }
    })
  })
})

describe('Form Schemas', () => {
  describe('step1Schema', () => {
    it('validates complete step 1 data', async () => {
      const validData = {
        aadhaarNumber: '123456789012',
        otp: '123456'
      }
      
      await expect(step1Schema.validate(validData)).resolves.toEqual(validData)
    })

    it('rejects incomplete step 1 data', async () => {
      const invalidData = {
        aadhaarNumber: '123456789012'
        // missing otp
      }
      
      await expect(step1Schema.validate(invalidData)).rejects.toThrow()
    })
  })

  describe('step2Schema', () => {
    it('validates complete step 2 data', async () => {
      const validData = {
        panNumber: 'ABCDE1234F',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        mobile: '9876543210',
        address: '123 Main Street, City',
        pincode: '110001',
        city: 'Delhi',
        state: 'Delhi'
      }
      
      await expect(step2Schema.validate(validData)).resolves.toEqual(validData)
    })

    it('rejects incomplete step 2 data', async () => {
      const invalidData = {
        panNumber: 'ABCDE1234F',
        firstName: 'John'
        // missing other required fields
      }
      
      await expect(step2Schema.validate(invalidData)).rejects.toThrow()
    })
  })

  describe('completeFormSchema', () => {
    it('validates complete form data', async () => {
      const validData = {
        aadhaarNumber: '123456789012',
        otp: '123456',
        panNumber: 'ABCDE1234F',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        mobile: '9876543210',
        address: '123 Main Street, City',
        pincode: '110001',
        city: 'Delhi',
        state: 'Delhi'
      }
      
      await expect(completeFormSchema.validate(validData)).resolves.toEqual(validData)
    })

    it('rejects incomplete form data', async () => {
      const invalidData = {
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F'
        // missing other required fields
      }
      
      await expect(completeFormSchema.validate(invalidData)).rejects.toThrow()
    })
  })
})
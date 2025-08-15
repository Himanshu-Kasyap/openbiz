/**
 * @fileoverview Registration service for handling Udyam registration business logic
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const { prisma } = require('../config/database');
const { AppError, ValidationError, DatabaseError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Registration service class
 */
class RegistrationService {
  /**
   * Generate a new session ID
   * @returns {string}
   */
  static generateSessionId() {
    return `udyam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simulate Aadhaar OTP verification
   * @param {string} aadhaarNumber - Aadhaar number
   * @param {string} otp - OTP to verify
   * @returns {Promise<boolean>}
   */
  static async verifyAadhaarOTP(aadhaarNumber, otp) {
    // Simulate OTP verification logic
    // In real implementation, this would call external Aadhaar verification service
    
    // For demo purposes, accept specific test OTPs
    const validTestOTPs = ['123456', '000000'];
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For testing: accept test OTPs or OTP that matches last 6 digits of Aadhaar
    const isValidTestOTP = validTestOTPs.includes(otp);
    const isMatchingOTP = otp === aadhaarNumber.slice(-6);
    
    return isValidTestOTP || isMatchingOTP;
  }

  /**
   * Simulate PAN verification
   * @param {string} panNumber - PAN number
   * @returns {Promise<boolean>}
   */
  static async verifyPAN(panNumber) {
    // Simulate PAN verification logic
    // In real implementation, this would call external PAN verification service
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // For demo purposes, reject specific test PANs
    const invalidTestPANs = ['INVALID01A', 'TEST12345'];
    
    return !invalidTestPANs.includes(panNumber.toUpperCase());
  }

  /**
   * Process Step 1 registration (Aadhaar verification)
   * @param {Object} data - Step 1 form data
   * @param {string} data.aadhaarNumber - Aadhaar number
   * @param {string} data.otp - OTP for verification
   * @param {string} [data.sessionId] - Existing session ID
   * @returns {Promise<Object>}
   */
  static async processStep1(data) {
    const { aadhaarNumber, otp, sessionId } = data;

    try {
      // Verify OTP
      const isValidOTP = await this.verifyAadhaarOTP(aadhaarNumber, otp);
      
      if (!isValidOTP) {
        throw new ValidationError('Invalid OTP. Please check and try again.');
      }

      // Create or update user session
      let user;
      let newSessionId = sessionId;

      if (sessionId) {
        // Try to find existing user by session ID
        user = await prisma.user.findUnique({
          where: { sessionId }
        });
      }

      if (!user) {
        // Create new user session
        newSessionId = this.generateSessionId();
        user = await prisma.user.create({
          data: {
            sessionId: newSessionId,
            status: 'step1_completed'
          }
        });
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'step1_completed',
            updatedAt: new Date()
          }
        });
      }

      // Store form submission
      await prisma.formSubmission.create({
        data: {
          userId: user.id,
          stepNumber: 1,
          formData: {
            aadhaarNumber: aadhaarNumber.replace(/\d(?=\d{4})/g, '*'), // Mask Aadhaar for security
            verifiedAt: new Date().toISOString()
          },
          validationStatus: 'completed'
        }
      });

      logger.info('Step 1 registration completed', {
        sessionId: newSessionId,
        userId: user.id
      });

      return {
        success: true,
        sessionId: newSessionId,
        nextStep: 2,
        message: 'Aadhaar verification completed successfully'
      };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Step 1 registration failed', {
        error: error.message,
        aadhaarNumber: aadhaarNumber.replace(/\d(?=\d{4})/g, '*')
      });
      
      throw new DatabaseError('Failed to process Step 1 registration');
    }
  }

  /**
   * Process Step 2 registration (PAN verification and personal details)
   * @param {Object} data - Step 2 form data
   * @returns {Promise<Object>}
   */
  static async processStep2(data) {
    const { sessionId, panNumber, personalDetails } = data;

    try {
      // Find user by session ID
      const user = await prisma.user.findUnique({
        where: { sessionId },
        include: {
          submissions: {
            where: { stepNumber: 1 },
            orderBy: { submittedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!user) {
        throw new ValidationError('Invalid session. Please start from Step 1.');
      }

      if (user.submissions.length === 0) {
        throw new ValidationError('Step 1 not completed. Please complete Aadhaar verification first.');
      }

      // Verify PAN
      const isValidPAN = await this.verifyPAN(panNumber);
      
      if (!isValidPAN) {
        throw new ValidationError('Invalid PAN number. Please check and try again.');
      }

      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'step2_completed',
          updatedAt: new Date()
        }
      });

      // Store form submission
      await prisma.formSubmission.create({
        data: {
          userId: user.id,
          stepNumber: 2,
          formData: {
            panNumber,
            personalDetails,
            verifiedAt: new Date().toISOString()
          },
          validationStatus: 'completed'
        }
      });

      logger.info('Step 2 registration completed', {
        sessionId,
        userId: user.id,
        panNumber
      });

      return {
        success: true,
        sessionId,
        status: 'completed',
        message: 'Registration completed successfully'
      };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Step 2 registration failed', {
        error: error.message,
        sessionId,
        panNumber
      });
      
      throw new DatabaseError('Failed to process Step 2 registration');
    }
  }

  /**
   * Get registration status by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>}
   */
  static async getRegistrationStatus(sessionId) {
    try {
      const user = await prisma.user.findUnique({
        where: { sessionId },
        include: {
          submissions: {
            orderBy: { submittedAt: 'desc' }
          }
        }
      });

      if (!user) {
        throw new ValidationError('Session not found');
      }

      const step1Completed = user.submissions.some(s => s.stepNumber === 1 && s.validationStatus === 'completed');
      const step2Completed = user.submissions.some(s => s.stepNumber === 2 && s.validationStatus === 'completed');

      let currentStep = 1;
      let status = 'in_progress';

      if (step2Completed) {
        currentStep = 2;
        status = 'completed';
      } else if (step1Completed) {
        currentStep = 2;
        status = 'step1_completed';
      }

      return {
        sessionId,
        status,
        currentStep,
        steps: {
          step1: {
            completed: step1Completed,
            completedAt: step1Completed ? user.submissions.find(s => s.stepNumber === 1)?.submittedAt : null
          },
          step2: {
            completed: step2Completed,
            completedAt: step2Completed ? user.submissions.find(s => s.stepNumber === 2)?.submittedAt : null
          }
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Failed to get registration status', {
        error: error.message,
        sessionId
      });
      
      throw new DatabaseError('Failed to retrieve registration status');
    }
  }

  /**
   * Validate individual field
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @returns {Promise<Object>}
   */
  static async validateField(field, value) {
    try {
      const { patterns } = require('../schemas/registration');
      
      let isValid = false;
      let message = '';

      switch (field) {
        case 'aadhaarNumber':
          isValid = patterns.AADHAAR_PATTERN.test(value);
          message = isValid ? 'Valid Aadhaar number' : 'Aadhaar number must be exactly 12 digits';
          break;
          
        case 'panNumber':
          isValid = patterns.PAN_PATTERN.test(value);
          if (isValid) {
            // Additional PAN verification
            isValid = await this.verifyPAN(value);
            message = isValid ? 'Valid PAN number' : 'PAN number verification failed';
          } else {
            message = 'PAN number must follow format: 5 letters, 4 digits, 1 letter';
          }
          break;
          
        case 'otp':
          isValid = patterns.OTP_PATTERN.test(value);
          message = isValid ? 'Valid OTP format' : 'OTP must be exactly 6 digits';
          break;
          
        case 'mobileNumber':
          isValid = patterns.MOBILE_PATTERN.test(value);
          message = isValid ? 'Valid mobile number' : 'Mobile number must be 10 digits starting with 6, 7, 8, or 9';
          break;
          
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(value);
          message = isValid ? 'Valid email address' : 'Please provide a valid email address';
          break;
          
        case 'pincode':
          isValid = patterns.PINCODE_PATTERN.test(value);
          message = isValid ? 'Valid PIN code' : 'PIN code must be exactly 6 digits';
          break;
          
        default:
          throw new ValidationError('Invalid field name');
      }

      return {
        field,
        value,
        isValid,
        message
      };

    } catch (error) {
      logger.error('Field validation failed', {
        error: error.message,
        field,
        value: field.includes('aadhaar') ? value.replace(/\d(?=\d{4})/g, '*') : value
      });
      
      throw error;
    }
  }
}

module.exports = RegistrationService;
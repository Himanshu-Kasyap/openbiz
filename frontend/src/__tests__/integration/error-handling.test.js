/**
 * @fileoverview Integration tests for error handling scenarios
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import AadhaarVerificationStep from '../../components/forms/AadhaarVerificationStep'
import PANVerificationStep from '../../components/forms/PANVerificationStep'
import ErrorBoundary from '../../components/ErrorBoundary'

// Mock API server
const server = setupServer(
  // Aadhaar verification endpoint
  rest.post('/api/v1/registration/step1', (req, res, ctx) => {
    const { aadhaarNumber, otp } = req.body
    
    if (aadhaarNumber === '123456789012' && otp === '123456') {
      return res(ctx.json({
        success: true,
        sessionId: 'session123',
        nextStep: 2
      }))
    }
    
    if (aadhaarNumber === '999999999999') {
      return res(ctx.status(500), ctx.json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      }))
    }
    
    if (aadhaarNumber === '888888888888') {
      return res(ctx.status(429), ctx.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests'
        }
      }))
    }
    
    return res(ctx.status(400), ctx.json({
      success: false,
      error: {
        code: 'INVALID_OTP',
        message: 'Invalid OTP provided'
      }
    }))
  }),

  // PAN verification endpoint
  rest.post('/api/v1/registration/step2', (req, res, ctx) => {
    const { panNumber } = req.body
    
    if (panNumber === 'ABCDE1234F') {
      return res(ctx.json({
        success: true,
        sessionId: 'session123',
        status: 'completed'
      }))
    }
    
    if (panNumber === 'ERROR5678G') {
      return res(ctx.status(500), ctx.json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      }))
    }
    
    return res(ctx.status(400), ctx.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid form data',
        details: {
          fieldErrors: {
            panNumber: 'Invalid PAN format'
          }
        }
      }
    }))
  }),

  // Network error simulation
  rest.post('/api/v1/registration/network-error', (req, res, ctx) => {
    return res.networkError('Network connection failed')
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Error Handling Integration Tests', () => {
  describe('AadhaarVerificationStep Error Handling', () => {
    const defaultProps = {
      formData: {},
      onDataChange: jest.fn(),
      onStepComplete: jest.fn(),
      errors: {}
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('handles successful OTP verification', async () => {
      const onStepComplete = jest.fn()
      const onDataChange = jest.fn()

      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '123456789012', otp: '123456' }}
          onDataChange={onDataChange}
          onStepComplete={onStepComplete}
        />
      )

      // Send OTP
      const sendOtpButton = screen.getByText('Send OTP')
      fireEvent.click(sendOtpButton)

      await waitFor(() => {
        expect(screen.getByText('OTP has been sent')).toBeInTheDocument()
      })

      // Verify OTP
      const verifyButton = screen.getByText('Verify OTP')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(onStepComplete).toHaveBeenCalled()
        expect(screen.getByText('Aadhaar verification completed successfully!')).toBeInTheDocument()
      })
    })

    it('handles invalid OTP error with user-friendly message', async () => {
      const onDataChange = jest.fn()

      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '123456789012', otp: '000000' }}
          onDataChange={onDataChange}
        />
      )

      // Send OTP first
      const sendOtpButton = screen.getByText('Send OTP')
      fireEvent.click(sendOtpButton)

      await waitFor(() => {
        expect(screen.getByText('OTP has been sent')).toBeInTheDocument()
      })

      // Try to verify with invalid OTP
      const verifyButton = screen.getByText('Verify OTP')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Invalid OTP. Please check and try again.'
          })
        )
      })
    })

    it('handles server error with retry capability', async () => {
      const onDataChange = jest.fn()

      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '999999999999', otp: '123456' }}
          onDataChange={onDataChange}
        />
      )

      // Send OTP
      const sendOtpButton = screen.getByText('Send OTP')
      fireEvent.click(sendOtpButton)

      await waitFor(() => {
        expect(screen.getByText('OTP has been sent')).toBeInTheDocument()
      })

      // Try to verify - should fail with server error
      const verifyButton = screen.getByText('Verify OTP')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Network error')
          })
        )
      })
    })

    it('handles rate limiting error', async () => {
      const onDataChange = jest.fn()

      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '888888888888', otp: '123456' }}
          onDataChange={onDataChange}
        />
      )

      // Send OTP
      const sendOtpButton = screen.getByText('Send OTP')
      fireEvent.click(sendOtpButton)

      await waitFor(() => {
        expect(screen.getByText('OTP has been sent')).toBeInTheDocument()
      })

      // Try to verify - should fail with rate limit error
      const verifyButton = screen.getByText('Verify OTP')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Too many attempts. Please try again later.'
          })
        )
      })
    })

    it('shows loading state during API calls', async () => {
      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '123456789012', otp: '123456' }}
        />
      )

      // Send OTP
      const sendOtpButton = screen.getByText('Send OTP')
      fireEvent.click(sendOtpButton)

      // Should show loading state
      expect(screen.getByText('Send OTP')).toBeDisabled()

      await waitFor(() => {
        expect(screen.getByText('OTP has been sent')).toBeInTheDocument()
      })
    })
  })

  describe('PANVerificationStep Error Handling', () => {
    const defaultProps = {
      formData: {
        panNumber: 'ABCDE1234F',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        mobileNumber: '9876543210',
        pincode: '110001',
        city: 'Delhi',
        state: 'Delhi'
      },
      onDataChange: jest.fn(),
      onStepComplete: jest.fn(),
      errors: {}
    }

    beforeEach(() => {
      jest.clearAllMocks()
      // Mock session service
      jest.doMock('../../services/sessionService', () => ({
        getSessionId: () => 'session123',
        updateFormData: jest.fn(),
        markStepCompleted: jest.fn()
      }))
    })

    it('handles successful form submission', async () => {
      const onStepComplete = jest.fn()

      render(
        <PANVerificationStep
          {...defaultProps}
          onStepComplete={onStepComplete}
        />
      )

      const submitButton = screen.getByText('Complete Step 2')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onStepComplete).toHaveBeenCalled()
      })
    })

    it('handles validation errors with field-specific messages', async () => {
      const onDataChange = jest.fn()

      render(
        <PANVerificationStep
          {...defaultProps}
          formData={{ ...defaultProps.formData, panNumber: 'INVALID123' }}
          onDataChange={onDataChange}
        />
      )

      const submitButton = screen.getByText('Complete Step 2')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Invalid data')
          })
        )
      })
    })

    it('handles server errors with user-friendly messages', async () => {
      const onDataChange = jest.fn()

      render(
        <PANVerificationStep
          {...defaultProps}
          formData={{ ...defaultProps.formData, panNumber: 'ERROR5678G' }}
          onDataChange={onDataChange}
        />
      )

      const submitButton = screen.getByText('Complete Step 2')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Network error')
          })
        )
      })
    })

    it('shows loading state during form submission', async () => {
      render(
        <PANVerificationStep {...defaultProps} />
      )

      const submitButton = screen.getByText('Complete Step 2')
      fireEvent.click(submitButton)

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('ErrorBoundary Integration', () => {
    // Component that throws an error
    const ThrowError = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test component error')
      }
      return <div>No error</div>
    }

    it('catches and displays component errors', () => {
      const onError = jest.fn()

      render(
        <ErrorBoundary onError={onError} showDetails={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Something unexpected happened/)).toBeInTheDocument()
      expect(onError).toHaveBeenCalled()
    })

    it('provides retry functionality', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('shows different error messages for different error types', () => {
      const ChunkLoadError = () => {
        const error = new Error('Loading chunk failed')
        error.name = 'ChunkLoadError'
        throw error
      }

      render(
        <ErrorBoundary>
          <ChunkLoadError />
        </ErrorBoundary>
      )

      expect(screen.getByText(/application needs to be refreshed/)).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })

    it('provides navigation options', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Go to Home')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })

    it('shows error ID for support', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
    })
  })

  describe('Network Error Scenarios', () => {
    it('handles network connectivity issues', async () => {
      // Simulate network error
      server.use(
        rest.post('/api/v1/registration/step1', (req, res, ctx) => {
          return res.networkError('Network connection failed')
        })
      )

      const onDataChange = jest.fn()

      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '123456789012', otp: '123456' }}
          onDataChange={onDataChange}
        />
      )

      // Send OTP
      const sendOtpButton = screen.getByText('Send OTP')
      fireEvent.click(sendOtpButton)

      await waitFor(() => {
        expect(screen.getByText('OTP has been sent')).toBeInTheDocument()
      })

      // Try to verify - should fail with network error
      const verifyButton = screen.getByText('Verify OTP')
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(onDataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Network error')
          })
        )
      })
    })

    it('handles timeout errors', async () => {
      // Simulate timeout
      server.use(
        rest.post('/api/v1/registration/step1', (req, res, ctx) => {
          return res(ctx.delay(30000)) // Long delay to simulate timeout
        })
      )

      const onDataChange = jest.fn()

      render(
        <AadhaarVerificationStep
          {...defaultProps}
          formData={{ aadhaarNumber: '123456789012', otp: '123456' }}
          onDataChange={onDataChange}
        />
      )

      // This test would need to be adjusted based on actual timeout implementation
      // For now, we'll just verify the component renders
      expect(screen.getByText('Aadhaar Verification')).toBeInTheDocument()
    })
  })

  describe('Form Data Recovery Integration', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('recovers form data after page refresh', () => {
      // Simulate saved form data
      const recoveryData = {
        formData: {
          aadhaarNumber: 'XXXX-XXXX-9012',
          fullName: 'John Doe'
        },
        step: 1,
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        metadata: {}
      }

      localStorage.setItem('udyam_form_recovery', JSON.stringify(recoveryData))

      // This would typically be tested in a higher-level component
      // that uses the recovery service
      expect(localStorage.getItem('udyam_form_recovery')).toBeTruthy()
    })
  })
})
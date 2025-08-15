/**
 * @fileoverview End-to-end integration tests for complete registration workflow
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import Registration from '../../pages/registration'
import registrationApi from '../../services/registrationApi'
import locationApi from '../../services/locationApi'
import sessionService from '../../services/sessionService'

// Mock dependencies
jest.mock('next/router')
jest.mock('../../services/registrationApi')
jest.mock('../../services/locationApi')
jest.mock('../../services/sessionService')

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
useRouter.mockImplementation(() => ({
  push: mockPush,
  replace: mockReplace,
  query: {}
}))

// Mock API responses
const mockStep1Response = {
  success: true,
  sessionId: 'test_session_123',
  nextStep: 2,
  message: 'Aadhaar verification completed successfully'
}

const mockStep2Response = {
  success: true,
  sessionId: 'test_session_123',
  status: 'completed',
  message: 'Registration completed successfully'
}

const mockLocationResponse = {
  pincode: '110001',
  city: 'New Delhi',
  state: 'Delhi',
  district: 'Central Delhi',
  country: 'India'
}

const mockRegistrationStatus = {
  sessionId: 'test_session_123',
  status: 'completed',
  currentStep: 2,
  steps: {
    step1: { completed: true, completedAt: '2024-01-01T10:00:00Z' },
    step2: { completed: true, completedAt: '2024-01-01T10:05:00Z' }
  },
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:05:00Z'
}

describe('Registration E2E Workflow', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default mock implementations
    registrationApi.submitStep1.mockResolvedValue(mockStep1Response)
    registrationApi.submitStep2.mockResolvedValue(mockStep2Response)
    registrationApi.getRegistrationStatus.mockResolvedValue(mockRegistrationStatus)
    locationApi.getLocationByPincode.mockResolvedValue(mockLocationResponse)
    
    sessionService.loadSession.mockReturnValue(null)
    sessionService.getSessionId.mockReturnValue(null)
    sessionService.initializeSession.mockReturnValue('test_session_123')
    sessionService.updateFormData.mockImplementation(() => {})
    sessionService.saveSession.mockImplementation(() => {})
    sessionService.markStepCompleted.mockImplementation(() => {})
    sessionService.clearSession.mockImplementation(() => {})
  })

  describe('Complete Registration Flow', () => {
    test('should complete step 1 successfully', async () => {
      render(<Registration />)

      // Verify initial state - Step 1
      expect(screen.getByText('Aadhaar Verification')).toBeInTheDocument()


      const aadhaarInput = screen.getar/i)
      await user.type(aadhaarInput, '123456789012')

nd OTP
      const sendO
      await user.click(sendOtpButton)


      await waitFor(() => {
        expect(screen.getByment()
      })

 OTP
      const otpInp
      await user.type(otpInput, '123456')

)
      await waitFor(() => {
        expect(registrationh({
          aadhaarNumber: '123456789012',
          otp: '123456',
          sessionId: 'te
        })
      })

to-advance
      await waitFor(() => {
        expect(screen.getBy
      }, { timeout: 2000 })

ement
      expect(sessionService.update()
      expect(sessionService.markStepCompleted).toHaveBeenCalleth(0)
    })

    test('should handle API errors gracefully') => {
      // Mock API error
      registrationApi.submitStep1.mockRejecte
,
        message: 'Invalid OTP'
      })

      render(<Registration />)

ata
      const aadhaarInput = screen.getByPlaceholderText(i)
      await user.type(aadhaarInput, '123456789012')

      const sendOtpButton = screen.getByRole('button', { name: /send ot/i })
      await user.click(sendOtpButton)

      await waitFor(() => {
        expect(screen.getByText(/otp has been sent/i)).to)
    })

      const otpInput = screen.getByPlaceholderText(/enter.*otp/i)
      await user.type(otpInput, '000000')

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid otp/i)).toBeInTheDocument()
      })
   })

    test('should restore session state on page reload', async () => {
      //ion

        sessionId: 'existing_session_456',
        currentStep: 2,
        formData: {
          aadhaarNumber: '123456789012',
          otp: '123456',
1234F',
          fullName: '
        },
        completedSteps: [true, false]


      sessionService.loadSession.mockReturnValue(existingSession)



      // Should start on St
      expect(screen.getByText('PAN & Personal Details')).toBeInTheent()
      expect(screen.getByDisplayValue('Acument()
      expect(screen.getByDisplayVa
    })

    test('should handle PIN 
      // Mock location API failure
      locationApi.getLocatible'))

      // Mock completed Step 1
      sessionService.lalue({
        sessionId: 'test_session',
        currentStep: 2,
        formData: { aadhaarNu
        completedSteps: [true, lse]
      })

      rend

de
      const pincodeInput = screen.getByPl/i)
      await user.type(pinco')

      // Should not show aull message
(() => {
        expect(screen.queryByTeument()
      })

ntry
      const cityInput = screen.getByPlaceholderText(/enter.*ci)
      const stateInput ate/i)
      
      expect(cityInpBe('')
      expect(stateInput.value)'')

tate
      await user.type(cityInpu')
)

      expect(cityInput.value).toBe('New Delhi')
      expect(stateInput.value).toBe('Delhi')


    test('should validate form fields
>)

      // Test invalid Aadhaar
      coi)
t

      // Should show validation error
{
        expect(screen.getByText(/
      })

      //adhaar

      await user.type(aadhaarInput, )

      // Error should disappear
> {
        expect(screen.querynt()
      })
    })

{
      // Mock expired session
      sessionService.loadSeue(null)
      sessionService.getSessionId

      render(<Registration />)

      // Should start fresh fr
cument()

      // Form should be empty
      const aadhaarInput = screen.getByPlaceholderThaar/i)
)
    })
  })

  describe('PIN Code Auto-f> {
    beforeEach(() => {
      //ep 1
ue({
        sessionId: 'test_session',
        currentStep: 2,
6' },
        completedSteps: [true, 
      })
    })


      render(<Registration />)

      // Fill PIN code
/i)
      await user.type(pincodeInp

      // Wait for location API call
      await waitFor(() => {
      
 })

      // Should show auto-fillsage
      await waitFor(() => {
        expect(screen.getByText(/auto-fill
      })

      // Verify city and state are auto-
      const cityInput = i')
      const stateInput = screen.ge
      expect(cityInput).toBeInent()
      expeent()
    })

c () => {
      render(<Registration />)

      // Fill invalid PIN code
i)
      await user.type(pincodeInput, '12345') // Too short

      // Should not call location API
      expect(locationApi.getLocationByPincode).not.toHaveBeenCalled()

      // Should not show auto-fill message
      expect(screen.queryByText(/auto-filled/i)).not.toBeInTheDoc
    })


  describe('Error Boundary Integra> {
    test('should handle component errors gracefully', async () => {
ror
      const consoleSpy = jest. {})
    
      // Force an error by making the API throw durrender
      registrationApi.submitStep1.mockImplementati() => {
        throw new Error('Component
      })

      render(<Registration />)


      expect(screen.getByText('Aadhnt()

()
    })
  })


    test('should be keyboard navigable', a
      render(<Registration 

      co
     
      // Focus should start on first input
      aadhaarInput.focus()
      expect(document.activeElement).toBe(aadhaarInput)

      // Tab navigation should work
      await user.tab()
   
      // Should move to next focusable element
      expect(document.activeElement).not.toBeut)
    })

    test('should have proper ARIA labels and ro) => {
      render(<Registration />)

ngs
      expect(screen.getByRole('heading', { level: 1 })).toHaveTexton')
      expect(screen.getByRole(

      // Check for proper forontrols
      const aadhaarInput = screen.getByPlaceholderText(/enter.*aadhaar/i)
      expect(aadhaarInput).toHaveAttribute('required')
    })
  })
})
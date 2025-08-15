describe('Udyam Registration Flow', () => {
  beforeEach(() => {
    // Mock API responses
    cy.mockApiResponse('POST', '/api/v1/registration/step1', {
      success: true,
      sessionId: 'test-session-123',
      nextStep: 2,
    }).as('verifyAadhaar')

    cy.mockApiResponse('POST', '/api/v1/registration/verify-otp', {
      success: true,
      verified: true,
    }).as('verifyOTP')

    cy.mockApiResponse('POST', '/api/v1/registration/step2', {
      success: true,
      completed: true,
      registrationId: 'REG123456',
    }).as('submitStep2')

    cy.mockApiResponse('GET', '/api/v1/pincode/*/location', {
      city: 'Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai',
    }).as('locationLookup')

    cy.visit('/registration')
  })

  it('should complete the full registration flow successfully', () => {
    // Verify initial state
    cy.get('[data-testid="progress-tracker"]').should('be.visible')
    cy.get('[data-testid="progress-step-1"]').should('have.class', 'active')
    cy.get('[data-testid="progress-step-2"]').should('have.class', 'inactive')

    // Step 1: Aadhaar Verification
    cy.get('[data-testid="step-1-container"]').should('be.visible')
    
    // Test invalid Aadhaar first
    cy.fillAadhaar('12345')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()
    cy.get('[data-testid="error-message"]').should('contain', 'Please enter a valid 12-digit Aadhaar number')

    // Enter valid Aadhaar
    cy.fillAadhaar('123456789012')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()
    cy.waitForApiResponse('@verifyAadhaar')

    // OTP input should appear
    cy.get('[data-testid="otp-container"]').should('be.visible')
    
    // Test invalid OTP
    cy.fillOTP('123')
    cy.get('[data-testid="verify-otp-btn"]').click()
    cy.get('[data-testid="error-message"]').should('contain', 'Please enter a valid 6-digit OTP')

    // Enter valid OTP
    cy.fillOTP('123456')
    cy.get('[data-testid="verify-otp-btn"]').click()
    cy.waitForApiResponse('@verifyOTP')

    // Step 1 should be completed
    cy.checkStepCompleted(1)
    cy.get('[data-testid="progress-step-2"]').should('have.class', 'active')

    // Step 2: PAN Verification
    cy.get('[data-testid="step-2-container"]').should('be.visible')
    
    // Test invalid PAN
    cy.fillPAN('INVALID')
    cy.get('[data-testid="submit-step2-btn"]').click()
    cy.get('[data-testid="error-message"]').should('contain', 'Please enter a valid PAN number')

    // Enter valid PAN
    cy.fillPAN('ABCDE1234F')
    
    // Fill personal details
    cy.get('[data-testid="name-input"]').type('John Doe')
    cy.get('[data-testid="mobile-input"]').type('9876543210')
    cy.get('[data-testid="email-input"]').type('john@example.com')
    
    // Test PIN code auto-fill
    cy.get('[data-testid="pincode-input"]').type('400001')
    cy.waitForApiResponse('@locationLookup')
    cy.get('[data-testid="city-input"]').should('have.value', 'Mumbai')
    cy.get('[data-testid="state-input"]').should('have.value', 'Maharashtra')

    // Submit step 2
    cy.get('[data-testid="submit-step2-btn"]').click()
    cy.waitForApiResponse('@submitStep2')

    // Should redirect to success page
    cy.url().should('include', '/registration/success')
    cy.get('[data-testid="success-message"]').should('be.visible')
    cy.get('[data-testid="registration-id"]').should('contain', 'REG123456')
  })

  it('should handle network errors gracefully', () => {
    // Mock network error
    cy.intercept('POST', '/api/v1/registration/step1', {
      statusCode: 500,
      body: { error: 'Internal server error' },
    }).as('networkError')

    cy.fillAadhaar('123456789012')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()
    cy.waitForApiResponse('@networkError')

    // Should show error message and retry button
    cy.get('[data-testid="error-message"]').should('contain', 'Something went wrong')
    cy.get('[data-testid="retry-btn"]').should('be.visible')

    // Test retry functionality
    cy.mockApiResponse('POST', '/api/v1/registration/step1', {
      success: true,
      sessionId: 'test-session-123',
      nextStep: 2,
    }).as('retrySuccess')

    cy.get('[data-testid="retry-btn"]').click()
    cy.waitForApiResponse('@retrySuccess')
    cy.get('[data-testid="otp-container"]').should('be.visible')
  })

  it('should support form data recovery', () => {
    cy.testFormRecovery()
  })

  it('should be accessible', () => {
    cy.checkA11y()
    
    // Test keyboard navigation
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-testid', 'aadhaar-input')
    
    cy.tab()
    cy.focused().should('have.attr', 'data-testid', 'verify-aadhaar-btn')
  })

  it('should work on different screen sizes', () => {
    cy.testResponsive(['mobile', 'tablet', 'desktop'])
    
    // Test mobile-specific interactions
    cy.viewport(375, 667)
    cy.get('[data-testid="mobile-menu"]').should('be.visible')
    cy.get('[data-testid="progress-tracker"]').should('be.visible')
  })

  it('should handle slow network conditions', () => {
    cy.simulateSlowNetwork()
    
    cy.fillAadhaar('123456789012')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()
    
    // Should show loading state
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
    cy.get('[data-testid="verify-aadhaar-btn"]').should('be.disabled')
    
    // Wait for response
    cy.waitForApiResponse('@verifyAadhaar', 15000)
    cy.get('[data-testid="loading-spinner"]').should('not.exist')
  })
})
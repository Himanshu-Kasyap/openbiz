// Custom commands for Udyam registration testing

/**
 * Custom command to fill Aadhaar input with validation
 */
Cypress.Commands.add('fillAadhaar', (aadhaarNumber) => {
  cy.get('[data-testid="aadhaar-input"]')
    .clear()
    .type(aadhaarNumber)
    .should('have.value', aadhaarNumber)
})

/**
 * Custom command to fill OTP input
 */
Cypress.Commands.add('fillOTP', (otp) => {
  cy.get('[data-testid="otp-input"]')
    .clear()
    .type(otp)
    .should('have.value', otp)
})

/**
 * Custom command to fill PAN input with validation
 */
Cypress.Commands.add('fillPAN', (panNumber) => {
  cy.get('[data-testid="pan-input"]')
    .clear()
    .type(panNumber)
    .should('have.value', panNumber)
})

/**
 * Custom command to check form step completion
 */
Cypress.Commands.add('checkStepCompleted', (stepNumber) => {
  cy.get(`[data-testid="progress-step-${stepNumber}"]`)
    .should('have.class', 'completed')
})

/**
 * Custom command to wait for API response
 */
Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout })
})

/**
 * Custom command to mock API responses
 */
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response,
  })
})

/**
 * Custom command to test responsive design
 */
Cypress.Commands.add('testResponsive', (breakpoints = ['mobile', 'tablet', 'desktop']) => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720],
  }

  breakpoints.forEach((breakpoint) => {
    const [width, height] = viewports[breakpoint]
    cy.viewport(width, height)
    cy.get('body').should('be.visible')
  })
})

/**
 * Custom command to check accessibility
 */
Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.checkA11y(context, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      ...options.rules,
    },
    ...options,
  })
})

/**
 * Custom command to simulate slow network
 */
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), 2000)
      })
    })
  })
})

/**
 * Custom command to test form recovery
 */
Cypress.Commands.add('testFormRecovery', () => {
  // Fill form partially
  cy.fillAadhaar('123456789012')
  
  // Simulate page refresh
  cy.reload()
  
  // Check if form data is recovered
  cy.get('[data-testid="recovery-prompt"]').should('be.visible')
  cy.get('[data-testid="recover-data-btn"]').click()
  cy.get('[data-testid="aadhaar-input"]').should('have.value', '123456789012')
})

/**
 * Custom command to test error handling
 */
Cypress.Commands.add('testErrorHandling', (errorType = 'network') => {
  if (errorType === 'network') {
    cy.intercept('POST', '/api/v1/registration/**', {
      statusCode: 500,
      body: { error: 'Internal server error' },
    })
  }
  
  // Trigger the error
  cy.get('[data-testid="submit-btn"]').click()
  
  // Check error display
  cy.get('[data-testid="error-message"]').should('be.visible')
  cy.get('[data-testid="retry-btn"]').should('be.visible')
})

/**
 * Custom command to complete full registration flow
 */
Cypress.Commands.add('completeRegistrationFlow', () => {
  // Step 1: Aadhaar verification
  cy.fillAadhaar('123456789012')
  cy.get('[data-testid="verify-aadhaar-btn"]').click()
  cy.waitForApiResponse('@verifyAadhaar')
  
  // Fill OTP
  cy.fillOTP('123456')
  cy.get('[data-testid="verify-otp-btn"]').click()
  cy.waitForApiResponse('@verifyOTP')
  
  // Check step 1 completion
  cy.checkStepCompleted(1)
  
  // Step 2: PAN verification
  cy.fillPAN('ABCDE1234F')
  cy.get('[data-testid="submit-step2-btn"]').click()
  cy.waitForApiResponse('@submitStep2')
  
  // Check step 2 completion
  cy.checkStepCompleted(2)
  
  // Verify completion
  cy.url().should('include', '/registration/success')
})
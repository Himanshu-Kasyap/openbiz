describe('Accessibility Testing', () => {
  beforeEach(() => {
    cy.visit('/registration')
    cy.injectAxe()
  })

  it('should have no accessibility violations on initial load', () => {
    cy.checkA11y()
  })

  it('should maintain accessibility during form interactions', () => {
    // Fill Aadhaar and check accessibility
    cy.fillAadhaar('123456789012')
    cy.checkA11y()

    // Trigger validation error and check accessibility
    cy.get('[data-testid="aadhaar-input"]').clear().type('123')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()
    cy.checkA11y()

    // Check error message has proper ARIA attributes
    cy.get('[data-testid="error-message"]')
      .should('have.attr', 'role', 'alert')
      .should('have.attr', 'aria-live', 'polite')
  })

  it('should support keyboard navigation', () => {
    // Test tab order
    const expectedTabOrder = [
      'aadhaar-input',
      'verify-aadhaar-btn',
      'help-link',
    ]

    expectedTabOrder.forEach((testId, index) => {
      if (index === 0) {
        cy.get('body').tab()
      } else {
        cy.tab()
      }
      cy.focused().should('have.attr', 'data-testid', testId)
    })
  })

  it('should support screen readers', () => {
    // Check form labels
    cy.get('[data-testid="aadhaar-input"]')
      .should('have.attr', 'aria-label')
      .should('have.attr', 'aria-describedby')

    // Check progress tracker
    cy.get('[data-testid="progress-tracker"]')
      .should('have.attr', 'role', 'progressbar')
      .should('have.attr', 'aria-valuenow')
      .should('have.attr', 'aria-valuemax')

    // Check step indicators
    cy.get('[data-testid="progress-step-1"]')
      .should('have.attr', 'aria-current', 'step')
  })

  it('should have proper focus management', () => {
    // Fill Aadhaar and submit
    cy.fillAadhaar('123456789012')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()

    // Focus should move to OTP input when it appears
    cy.get('[data-testid="otp-input"]').should('be.focused')

    // Test focus trap in modal dialogs
    cy.get('[data-testid="help-btn"]').click()
    cy.get('[data-testid="help-modal"]').should('be.visible')
    
    // Focus should be trapped within modal
    cy.get('[data-testid="modal-close-btn"]').focus()
    cy.tab()
    cy.focused().should('have.attr', 'data-testid', 'modal-content')
  })

  it('should have sufficient color contrast', () => {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    })
  })

  it('should support high contrast mode', () => {
    // Simulate high contrast mode
    cy.get('body').invoke('addClass', 'high-contrast')
    cy.checkA11y()
  })

  it('should support reduced motion preferences', () => {
    // Simulate reduced motion preference
    cy.window().then((win) => {
      Object.defineProperty(win, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    })

    // Animations should be disabled
    cy.get('[data-testid="progress-tracker"]')
      .should('have.css', 'animation-duration', '0s')
  })

  it('should work with assistive technologies', () => {
    // Test ARIA live regions
    cy.fillAadhaar('123')
    cy.get('[data-testid="verify-aadhaar-btn"]').click()
    
    cy.get('[data-testid="error-live-region"]')
      .should('have.attr', 'aria-live', 'polite')
      .should('contain', 'Please enter a valid 12-digit Aadhaar number')

    // Test ARIA expanded states
    cy.get('[data-testid="help-btn"]').click()
    cy.get('[data-testid="help-btn"]')
      .should('have.attr', 'aria-expanded', 'true')
  })

  it('should handle form validation errors accessibly', () => {
    // Submit empty form
    cy.get('[data-testid="verify-aadhaar-btn"]').click()

    // Check error association
    cy.get('[data-testid="aadhaar-input"]')
      .should('have.attr', 'aria-invalid', 'true')
      .should('have.attr', 'aria-describedby')

    const describedBy = cy.get('[data-testid="aadhaar-input"]')
      .invoke('attr', 'aria-describedby')

    describedBy.then((id) => {
      cy.get(`#${id}`).should('contain', 'This field is required')
    })
  })
})
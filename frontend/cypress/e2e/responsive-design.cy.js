describe('Responsive Design Testing', () => {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    large: { width: 1920, height: 1080 },
  }

  beforeEach(() => {
    cy.visit('/registration')
  })

  Object.entries(viewports).forEach(([device, { width, height }]) => {
    describe(`${device} viewport (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height)
      })

      it('should display correctly', () => {
        // Check layout elements are visible
        cy.get('[data-testid="header"]').should('be.visible')
        cy.get('[data-testid="progress-tracker"]').should('be.visible')
        cy.get('[data-testid="form-container"]').should('be.visible')
        cy.get('[data-testid="footer"]').should('be.visible')
      })

      it('should have proper spacing and sizing', () => {
        // Check minimum touch target sizes on mobile
        if (device === 'mobile') {
          cy.get('[data-testid="verify-aadhaar-btn"]')
            .should('have.css', 'min-height', '44px')
            .should('have.css', 'min-width', '44px')
        }

        // Check form field sizing
        cy.get('[data-testid="aadhaar-input"]')
          .should('be.visible')
          .should('have.css', 'width')
          .then((width) => {
            expect(parseInt(width)).to.be.greaterThan(200)
          })
      })

      it('should handle form interactions properly', () => {
        // Test form filling
        cy.fillAadhaar('123456789012')
        cy.get('[data-testid="verify-aadhaar-btn"]').click()

        // Check responsive behavior of error messages
        cy.get('[data-testid="aadhaar-input"]').clear().type('123')
        cy.get('[data-testid="verify-aadhaar-btn"]').click()
        cy.get('[data-testid="error-message"]').should('be.visible')
      })

      it('should maintain usability', () => {
        // Check text readability
        cy.get('[data-testid="form-title"]')
          .should('have.css', 'font-size')
          .then((fontSize
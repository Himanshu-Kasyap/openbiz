// Import commands.js using ES2015 syntax:
import './commands'
import 'cypress-axe'

// Import global styles
import '../../src/styles/globals.css'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/react18'

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />)
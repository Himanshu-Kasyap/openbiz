import * as UIComponents from '../index'

describe('UI Components Index', () => {
  it('exports all expected components', () => {
    expect(UIComponents.Button).toBeDefined()
    expect(UIComponents.Card).toBeDefined()
    expect(UIComponents.CardHeader).toBeDefined()
    expect(UIComponents.CardBody).toBeDefined()
    expect(UIComponents.CardFooter).toBeDefined()
    expect(UIComponents.Container).toBeDefined()
    expect(UIComponents.Grid).toBeDefined()
    expect(UIComponents.Input).toBeDefined()
    expect(UIComponents.Responsive).toBeDefined()
  })

  it('exports responsive hooks', () => {
    expect(UIComponents.useBreakpoint).toBeDefined()
    expect(UIComponents.useMediaQuery).toBeDefined()
  })

  it('exports are functions or components', () => {
    expect(typeof UIComponents.Button).toBe('function')
    expect(typeof UIComponents.Card).toBe('function')
    expect(typeof UIComponents.Container).toBe('function')
    expect(typeof UIComponents.Grid).toBe('function')
    // Input is a forwardRef component, which creates an object with $$typeof property
    expect(UIComponents.Input).toBeDefined()
    expect(typeof UIComponents.Responsive).toBe('function')
    expect(typeof UIComponents.useBreakpoint).toBe('function')
    expect(typeof UIComponents.useMediaQuery).toBe('function')
  })
})
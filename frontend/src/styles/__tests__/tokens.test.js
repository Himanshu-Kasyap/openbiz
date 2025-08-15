import { tokens } from '../tokens'

describe('Design Tokens', () => {
  it('exports tokens object', () => {
    expect(tokens).toBeDefined()
    expect(typeof tokens).toBe('object')
  })

  it('contains color palette', () => {
    expect(tokens.colors).toBeDefined()
    expect(tokens.colors.primary).toBeDefined()
    expect(tokens.colors.secondary).toBeDefined()
    expect(tokens.colors.success).toBeDefined()
    expect(tokens.colors.error).toBeDefined()
    expect(tokens.colors.warning).toBeDefined()
    expect(tokens.colors.gray).toBeDefined()
  })

  it('contains typography scale', () => {
    expect(tokens.typography).toBeDefined()
    expect(tokens.typography.fontFamily).toBeDefined()
    expect(tokens.typography.fontSize).toBeDefined()
    expect(tokens.typography.fontWeight).toBeDefined()
  })

  it('contains spacing scale', () => {
    expect(tokens.spacing).toBeDefined()
    expect(tokens.spacing[0]).toBe('0px')
    expect(tokens.spacing[4]).toBe('1rem')
  })

  it('contains breakpoints', () => {
    expect(tokens.breakpoints).toBeDefined()
    expect(tokens.breakpoints.sm).toBe('640px')
    expect(tokens.breakpoints.md).toBe('768px')
    expect(tokens.breakpoints.lg).toBe('1024px')
  })

  it('contains border radius values', () => {
    expect(tokens.borderRadius).toBeDefined()
    expect(tokens.borderRadius.none).toBe('0')
    expect(tokens.borderRadius.full).toBe('9999px')
  })

  it('contains box shadow values', () => {
    expect(tokens.boxShadow).toBeDefined()
    expect(tokens.boxShadow.sm).toBeDefined()
    expect(tokens.boxShadow.lg).toBeDefined()
  })

  it('contains z-index scale', () => {
    expect(tokens.zIndex).toBeDefined()
    expect(tokens.zIndex[0]).toBe('0')
    expect(tokens.zIndex.auto).toBe('auto')
  })

  it('contains transition values', () => {
    expect(tokens.transitionDuration).toBeDefined()
    expect(tokens.transitionTimingFunction).toBeDefined()
    expect(tokens.transitionDuration[200]).toBe('200ms')
    expect(tokens.transitionTimingFunction.linear).toBe('linear')
  })

  it('has proper color structure with all shades', () => {
    const colorKeys = ['primary', 'secondary', 'success', 'error', 'warning', 'gray']
    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
    
    colorKeys.forEach(colorKey => {
      shades.forEach(shade => {
        expect(tokens.colors[colorKey][shade]).toBeDefined()
        expect(typeof tokens.colors[colorKey][shade]).toBe('string')
        expect(tokens.colors[colorKey][shade]).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })
})
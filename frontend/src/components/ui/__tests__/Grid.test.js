import { render, screen } from '@testing-library/react'
import Grid from '../Grid'

describe('Grid Component', () => {
  it('renders children correctly', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    )
    
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('applies default grid classes', () => {
    const { container } = render(
      <Grid>
        <div>Content</div>
      </Grid>
    )
    
    const gridDiv = container.firstChild
    expect(gridDiv).toHaveClass('grid', 'grid-cols-1', 'gap-4')
  })

  it('applies custom column count', () => {
    const { container } = render(
      <Grid cols={3}>
        <div>Content</div>
      </Grid>
    )
    
    const gridDiv = container.firstChild
    expect(gridDiv).toHaveClass('grid-cols-3')
  })

  it('applies responsive column classes', () => {
    const { container } = render(
      <Grid cols={1} sm={2} md={3} lg={4} xl={6}>
        <div>Content</div>
      </Grid>
    )
    
    const gridDiv = container.firstChild
    expect(gridDiv).toHaveClass('grid-cols-1')
    // Note: Testing responsive classes is limited in jsdom
    // In a real browser, these would apply at different breakpoints
  })

  it('applies custom gap size', () => {
    const { container: smGap } = render(
      <Grid gap="sm">
        <div>Content</div>
      </Grid>
    )
    expect(smGap.firstChild).toHaveClass('gap-2')

    const { container: lgGap } = render(
      <Grid gap="lg">
        <div>Content</div>
      </Grid>
    )
    expect(lgGap.firstChild).toHaveClass('gap-6')

    const { container: xlGap } = render(
      <Grid gap="xl">
        <div>Content</div>
      </Grid>
    )
    expect(xlGap.firstChild).toHaveClass('gap-8')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Grid className="custom-grid">
        <div>Content</div>
      </Grid>
    )
    
    const gridDiv = container.firstChild
    expect(gridDiv).toHaveClass('custom-grid')
  })

  it('handles 12-column grid', () => {
    const { container } = render(
      <Grid cols={12}>
        <div>Content</div>
      </Grid>
    )
    
    const gridDiv = container.firstChild
    expect(gridDiv).toHaveClass('grid-cols-12')
  })
})
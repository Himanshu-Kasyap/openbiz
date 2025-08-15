import { render, screen } from '@testing-library/react'
import Container from '../Container'

describe('Container Component', () => {
  it('renders children correctly', () => {
    render(
      <Container>
        <div>Test Content</div>
      </Container>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies default responsive classes', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>
    )
    
    const containerDiv = container.firstChild
    expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'max-w-screen-xl')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Container className="custom-class">
        <div>Content</div>
      </Container>
    )
    
    const containerDiv = container.firstChild
    expect(containerDiv).toHaveClass('custom-class')
  })

  it('applies fluid width when fluid prop is true', () => {
    const { container } = render(
      <Container fluid>
        <div>Content</div>
      </Container>
    )
    
    const containerDiv = container.firstChild
    expect(containerDiv).toHaveClass('w-full')
    expect(containerDiv).not.toHaveClass('max-w-screen-xl')
  })

  it('applies correct maxWidth classes', () => {
    const { container: smContainer } = render(
      <Container maxWidth="sm">
        <div>Content</div>
      </Container>
    )
    expect(smContainer.firstChild).toHaveClass('max-w-screen-sm')

    const { container: lgContainer } = render(
      <Container maxWidth="lg">
        <div>Content</div>
      </Container>
    )
    expect(lgContainer.firstChild).toHaveClass('max-w-screen-lg')

    const { container: xlContainer } = render(
      <Container maxWidth="2xl">
        <div>Content</div>
      </Container>
    )
    expect(xlContainer.firstChild).toHaveClass('max-w-screen-2xl')
  })

  it('does not apply maxWidth when fluid is true', () => {
    const { container } = render(
      <Container fluid maxWidth="lg">
        <div>Content</div>
      </Container>
    )
    
    const containerDiv = container.firstChild
    expect(containerDiv).toHaveClass('w-full')
    expect(containerDiv).not.toHaveClass('max-w-screen-lg')
  })
})
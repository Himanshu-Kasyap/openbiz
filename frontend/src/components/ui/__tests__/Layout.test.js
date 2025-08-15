import { render, screen } from '@testing-library/react'
import { Layout, Stack, Inline, Center } from '../Layout'

describe('Layout Component', () => {
  it('renders children correctly', () => {
    render(
      <Layout>
        <div>Test content</div>
      </Layout>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies flex layout by default', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('flex')
  })

  it('applies grid layout when specified', () => {
    const { container } = render(
      <Layout type="grid">
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('grid')
  })

  it('applies direction classes correctly', () => {
    const { container } = render(
      <Layout direction="column">
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('flex-col')
  })

  it('applies justify classes correctly', () => {
    const { container } = render(
      <Layout justify="center">
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('justify-center')
  })

  it('applies align classes correctly', () => {
    const { container } = render(
      <Layout align="center">
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('items-center')
  })

  it('applies gap classes correctly', () => {
    const { container } = render(
      <Layout gap="md">
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('gap-4')
  })

  it('applies wrap class when specified', () => {
    const { container } = render(
      <Layout wrap>
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('flex-wrap')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Layout className="custom-class">
        <div>Content</div>
      </Layout>
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('Stack Component', () => {
  it('renders as vertical flex layout', () => {
    const { container } = render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    )
    
    expect(container.firstChild).toHaveClass('flex', 'flex-col')
  })

  it('applies spacing correctly', () => {
    const { container } = render(
      <Stack spacing="lg">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    )
    
    expect(container.firstChild).toHaveClass('gap-6')
  })

  it('applies alignment correctly', () => {
    const { container } = render(
      <Stack align="center">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    )
    
    expect(container.firstChild).toHaveClass('items-center')
  })
})

describe('Inline Component', () => {
  it('renders as horizontal flex layout', () => {
    const { container } = render(
      <Inline>
        <div>Item 1</div>
        <div>Item 2</div>
      </Inline>
    )
    
    expect(container.firstChild).toHaveClass('flex', 'flex-row')
  })

  it('applies spacing correctly', () => {
    const { container } = render(
      <Inline spacing="sm">
        <div>Item 1</div>
        <div>Item 2</div>
      </Inline>
    )
    
    expect(container.firstChild).toHaveClass('gap-2')
  })

  it('applies justify correctly', () => {
    const { container } = render(
      <Inline justify="between">
        <div>Item 1</div>
        <div>Item 2</div>
      </Inline>
    )
    
    expect(container.firstChild).toHaveClass('justify-between')
  })

  it('applies wrap when specified', () => {
    const { container } = render(
      <Inline wrap>
        <div>Item 1</div>
        <div>Item 2</div>
      </Inline>
    )
    
    expect(container.firstChild).toHaveClass('flex-wrap')
  })
})

describe('Center Component', () => {
  it('centers content by default', () => {
    const { container } = render(
      <Center>
        <div>Centered content</div>
      </Center>
    )
    
    expect(container.firstChild).toHaveClass('flex', 'justify-center', 'items-center')
  })

  it('centers only horizontally when specified', () => {
    const { container } = render(
      <Center vertical={false}>
        <div>Content</div>
      </Center>
    )
    
    expect(container.firstChild).toHaveClass('justify-center', 'items-start')
  })

  it('centers only vertically when specified', () => {
    const { container } = render(
      <Center horizontal={false}>
        <div>Content</div>
      </Center>
    )
    
    expect(container.firstChild).toHaveClass('justify-start', 'items-center')
  })
})
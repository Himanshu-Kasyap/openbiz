import { clsx } from 'clsx'

/**
 * Flexible layout component for responsive designs
 * @param {Object} props
 * @param {React.ReactNode} props.children - Layout content
 * @param {'flex'|'grid'} [props.type='flex'] - Layout type
 * @param {'row'|'column'} [props.direction='row'] - Flex direction
 * @param {'start'|'center'|'end'|'between'|'around'|'evenly'} [props.justify='start'] - Justify content
 * @param {'start'|'center'|'end'|'stretch'|'baseline'} [props.align='start'] - Align items
 * @param {'none'|'sm'|'md'|'lg'|'xl'} [props.gap='none'] - Gap between items
 * @param {boolean} [props.wrap=false] - Whether to wrap items
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Layout({
  children,
  type = 'flex',
  direction = 'row',
  justify = 'start',
  align = 'start',
  gap = 'none',
  wrap = false,
  className,
  ...props
}) {
  const baseClasses = type === 'flex' ? 'flex' : 'grid'
  
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
  }
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  }
  
  const gapClasses = {
    none: '',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }
  
  return (
    <div
      className={clsx(
        baseClasses,
        type === 'flex' && [
          directionClasses[direction],
          justifyClasses[justify],
          alignClasses[align],
          wrap && 'flex-wrap',
        ],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Stack component for vertical layouts
 * @param {Object} props
 * @param {React.ReactNode} props.children - Stack content
 * @param {'sm'|'md'|'lg'|'xl'} [props.spacing='md'] - Spacing between items
 * @param {'start'|'center'|'end'|'stretch'} [props.align='start'] - Align items
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Stack({
  children,
  spacing = 'md',
  align = 'start',
  className,
  ...props
}) {
  return (
    <Layout
      type="flex"
      direction="column"
      align={align}
      gap={spacing}
      className={className}
      {...props}
    >
      {children}
    </Layout>
  )
}

/**
 * Inline component for horizontal layouts
 * @param {Object} props
 * @param {React.ReactNode} props.children - Inline content
 * @param {'sm'|'md'|'lg'|'xl'} [props.spacing='md'] - Spacing between items
 * @param {'start'|'center'|'end'|'between'|'around'|'evenly'} [props.justify='start'] - Justify content
 * @param {'start'|'center'|'end'|'stretch'|'baseline'} [props.align='center'] - Align items
 * @param {boolean} [props.wrap=false] - Whether to wrap items
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Inline({
  children,
  spacing = 'md',
  justify = 'start',
  align = 'center',
  wrap = false,
  className,
  ...props
}) {
  return (
    <Layout
      type="flex"
      direction="row"
      justify={justify}
      align={align}
      gap={spacing}
      wrap={wrap}
      className={className}
      {...props}
    >
      {children}
    </Layout>
  )
}

/**
 * Center component for centering content
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to center
 * @param {boolean} [props.horizontal=true] - Center horizontally
 * @param {boolean} [props.vertical=true] - Center vertically
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Center({
  children,
  horizontal = true,
  vertical = true,
  className,
  ...props
}) {
  return (
    <Layout
      type="flex"
      justify={horizontal ? 'center' : 'start'}
      align={vertical ? 'center' : 'start'}
      className={className}
      {...props}
    >
      {children}
    </Layout>
  )
}

export default Layout
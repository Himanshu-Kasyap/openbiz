import { clsx } from 'clsx'

/**
 * Responsive container component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Container content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.fluid=false] - Whether to use full width
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'} [props.maxWidth='xl'] - Maximum width
 * @returns {JSX.Element}
 */
export default function Container({ 
  children, 
  className, 
  fluid = false, 
  maxWidth = 'xl' 
}) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  }

  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8',
        !fluid && maxWidthClasses[maxWidth],
        fluid && 'w-full',
        className
      )}
    >
      {children}
    </div>
  )
}
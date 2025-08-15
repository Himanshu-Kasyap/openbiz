import { clsx } from 'clsx'

/**
 * Card component for content containers
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.padding=true] - Whether to include default padding
 * @param {boolean} [props.shadow=true] - Whether to include shadow
 * @returns {JSX.Element}
 */
export function Card({ children, className, padding = true, shadow = true }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200',
        shadow && 'shadow-sm',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Card header component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function CardHeader({ children, className }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  )
}

/**
 * Card body component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Body content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function CardBody({ children, className }) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  )
}

/**
 * Card footer component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function CardFooter({ children, className }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}>
      {children}
    </div>
  )
}

export default Card
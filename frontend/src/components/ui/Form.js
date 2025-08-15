import { clsx } from 'clsx'

/**
 * Form wrapper component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form content
 * @param {function} [props.onSubmit] - Form submit handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Form({ children, onSubmit, className, ...props }) {
  return (
    <form
      onSubmit={onSubmit}
      className={clsx('space-y-6', className)}
      {...props}
    >
      {children}
    </form>
  )
}

/**
 * Form section component for grouping related fields
 * @param {Object} props
 * @param {React.ReactNode} props.children - Section content
 * @param {string} [props.title] - Section title
 * @param {string} [props.description] - Section description
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function FormSection({ children, title, description, className }) {
  return (
    <div className={clsx('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

/**
 * Form row component for horizontal field layouts
 * @param {Object} props
 * @param {React.ReactNode} props.children - Row content
 * @param {'sm'|'md'|'lg'|'xl'} [props.spacing='md'] - Spacing between fields
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function FormRow({ children, className }) {
  return (
    <div className={clsx('grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6', className)}>
      {children}
    </div>
  )
}

/**
 * Form group component for field with label and validation
 * @param {Object} props
 * @param {React.ReactNode} props.children - Field content
 * @param {string} [props.label] - Field label
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function FormGroup({ 
  children, 
  label, 
  error, 
  helpText, 
  required = false, 
  className 
}) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="form-help">
          {helpText}
        </p>
      )}
    </div>
  )
}

/**
 * Form actions component for submit/cancel buttons
 * @param {Object} props
 * @param {React.ReactNode} props.children - Action buttons
 * @param {'left'|'center'|'right'|'between'} [props.align='right'] - Button alignment
 * @param {boolean} [props.sticky=false] - Whether to stick to bottom on mobile
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function FormActions({ 
  children, 
  align = 'right', 
  sticky = false, 
  className 
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }
  
  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200',
        alignClasses[align],
        sticky && 'sticky bottom-0 bg-white p-4 shadow-lg sm:static sm:bg-transparent sm:p-0 sm:shadow-none',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Responsive form field component that adapts to screen size
 * @param {Object} props
 * @param {React.ReactNode} props.children - Field content
 * @param {'full'|'half'|'third'|'quarter'} [props.width='full'] - Field width
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
export function FormField({ children, width = 'full', className }) {
  const widthClasses = {
    full: 'col-span-full',
    half: 'col-span-full sm:col-span-6',
    third: 'col-span-full sm:col-span-4',
    quarter: 'col-span-full sm:col-span-3',
  }
  
  return (
    <div className={clsx(widthClasses[width], className)}>
      {children}
    </div>
  )
}

export default Form
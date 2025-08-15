import { clsx } from 'clsx'

/**
 * ProgressTracker component showing Steps 1 & 2
 * @param {Object} props
 * @param {number} props.currentStep - Current active step (1 or 2)
 * @param {boolean[]} props.completedSteps - Array indicating which steps are completed
 * @param {string[]} [props.stepLabels] - Custom labels for steps
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
const ProgressTracker = ({
  currentStep,
  completedSteps = [],
  stepLabels = ['Aadhaar Verification', 'PAN & Personal Details'],
  className
}) => {
  const steps = [
    {
      number: 1,
      label: stepLabels[0],
      isCompleted: completedSteps[0] || false,
      isActive: currentStep === 1
    },
    {
      number: 2,
      label: stepLabels[1],
      isCompleted: completedSteps[1] || false,
      isActive: currentStep === 2
    }
  ]

  return (
    <div className={clsx('w-full', className)}>
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center space-x-4 sm:space-x-8">
          {steps.map((step, index) => (
            <li key={step.number} className="flex items-center">
              {/* Step indicator */}
              <div className="flex items-center">
                <div
                  className={clsx(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200',
                    step.isCompleted
                      ? 'bg-success-600 border-success-600 text-white'
                      : step.isActive
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  )}
                  aria-current={step.isActive ? 'step' : undefined}
                >
                  {step.isCompleted ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                
                {/* Step label */}
                <div className="ml-3 hidden sm:block">
                  <p
                    className={clsx(
                      'text-sm font-medium transition-colors duration-200',
                      step.isCompleted || step.isActive
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    )}
                  >
                    Step {step.number}
                  </p>
                  <p
                    className={clsx(
                      'text-sm transition-colors duration-200',
                      step.isCompleted
                        ? 'text-success-600'
                        : step.isActive
                        ? 'text-primary-600'
                        : 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'hidden sm:block w-16 h-0.5 ml-4 transition-colors duration-200',
                    step.isCompleted
                      ? 'bg-success-600'
                      : 'bg-gray-300'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
        
        {/* Mobile step labels */}
        <div className="mt-4 sm:hidden">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Step {currentStep} of {steps.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {steps.find(step => step.number === currentStep)?.label}
            </p>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default ProgressTracker
import { clsx } from 'clsx'
import { Button } from '../ui'

/**
 * FormNavigation component with Next/Previous functionality
 * @param {Object} props
 * @param {number} props.currentStep - Current active step
 * @param {number} props.totalSteps - Total number of steps
 * @param {boolean[]} props.completedSteps - Array indicating which steps are completed
 * @param {function} [props.onPrevious] - Handler for previous button click
 * @param {function} [props.onNext] - Handler for next button click
 * @param {boolean} [props.canGoNext=false] - Whether next button should be enabled
 * @param {boolean} [props.canGoPrevious=true] - Whether previous button should be enabled
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.nextLabel] - Custom label for next button
 * @param {string} [props.previousLabel] - Custom label for previous button
 * @param {boolean} [props.showProgress=true] - Whether to show step progress
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element}
 */
const FormNavigation = ({
  currentStep,
  totalSteps,
  completedSteps = [],
  onPrevious,
  onNext,
  canGoNext = false,
  canGoPrevious = true,
  isLoading = false,
  nextLabel,
  previousLabel = 'Previous',
  showProgress = true,
  className
}) => {
  // Determine button labels based on step
  const getNextLabel = () => {
    if (nextLabel) return nextLabel
    if (currentStep === totalSteps) return 'Complete Registration'
    return 'Next Step'
  }

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const currentStepCompleted = completedSteps[currentStep - 1] || false

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="text-center text-sm text-gray-600">
          <span className="font-medium">Step {currentStep} of {totalSteps}</span>
          {currentStepCompleted && (
            <span className="ml-2 inline-flex items-center">
              <svg
                className="w-4 h-4 text-success-600 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Completed
            </span>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Previous button */}
        {!isFirstStep && (
          <Button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious || isLoading}
            variant="outline"
            size="lg"
            className="sm:flex-1 order-2 sm:order-1"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {previousLabel}
          </Button>
        )}

        {/* Next button */}
        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          loading={isLoading}
          variant="primary"
          size="lg"
          className={clsx(
            'order-1 sm:order-2',
            isFirstStep ? 'w-full' : 'sm:flex-1'
          )}
        >
          {getNextLabel()}
          {!isLastStep && (
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </Button>
      </div>

      {/* Help text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {isLastStep 
            ? 'Review your information and complete the registration'
            : 'Complete all required fields to proceed to the next step'
          }
        </p>
      </div>
    </div>
  )
}

export default FormNavigation
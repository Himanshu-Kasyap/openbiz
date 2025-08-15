import { useForm as useReactHookForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

/**
 * Custom hook that wraps react-hook-form with default configuration
 * @param {Object} options
 * @param {Object} [options.schema] - Yup validation schema
 * @param {Object} [options.defaultValues] - Default form values
 * @param {'onChange'|'onBlur'|'onSubmit'|'onTouched'|'all'} [options.mode='onSubmit'] - Validation mode
 * @param {boolean} [options.reValidateMode='onChange'] - Re-validation mode
 * @returns {Object} React Hook Form methods and state
 */
export function useForm({
  schema,
  defaultValues = {},
  mode = 'onSubmit',
  reValidateMode = 'onChange',
  ...options
} = {}) {
  const formConfig = {
    mode,
    reValidateMode,
    defaultValues,
    ...options,
  }

  // Add Yup resolver if schema is provided
  if (schema) {
    formConfig.resolver = yupResolver(schema)
  }

  const form = useReactHookForm(formConfig)

  return {
    ...form,
    /**
     * Enhanced register function with better error handling
     * @param {string} name - Field name
     * @param {Object} options - Registration options
     * @returns {Object} Field registration object
     */
    register: (name, registerOptions = {}) => {
      return form.register(name, registerOptions)
    },

    /**
     * Get field error message
     * @param {string} name - Field name
     * @returns {string|undefined} Error message
     */
    getFieldError: (name) => {
      return form.formState.errors?.[name]?.message
    },

    /**
     * Check if field has error
     * @param {string} name - Field name
     * @returns {boolean} Whether field has error
     */
    hasFieldError: (name) => {
      return !!form.formState.errors?.[name]
    },

    /**
     * Get field state (touched, dirty, etc.)
     * @param {string} name - Field name
     * @returns {Object} Field state
     */
    getFieldState: (name) => {
      return {
        isTouched: !!form.formState.touchedFields?.[name],
        isDirty: !!form.formState.dirtyFields?.[name],
        hasError: !!form.formState.errors?.[name],
        error: form.formState.errors?.[name]?.message,
      }
    },

    /**
     * Reset specific field
     * @param {string} name - Field name
     * @param {any} value - New value
     */
    resetField: (name, value) => {
      form.resetField(name, { defaultValue: value })
    },

    /**
     * Set multiple field values at once
     * @param {Object} values - Object with field names as keys and values
     */
    setValues: (values) => {
      Object.entries(values).forEach(([name, value]) => {
        form.setValue(name, value, { shouldValidate: true, shouldDirty: true })
      })
    },
  }
}

export default useForm
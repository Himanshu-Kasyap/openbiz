/**
 * @fileoverview Unit tests for RetryButton component and useRetry hook
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import RetryButton, { useRetry } from '../RetryButton'

// Mock timers
jest.useFakeTimers()

describe('RetryButton', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it('renders with default props', () => {
    const onRetry = jest.fn()
    render(<RetryButton onRetry={onRetry} />)
    
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('calls onRetry when clicked', async () => {
    const onRetry = jest.fn().mockResolvedValue()
    render(<RetryButton onRetry={onRetry} />)
    
    const button = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(button)
    
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows retry count after failed attempts', async () => {
    const onRetry = jest.fn().mockRejectedValue(new Error('Test error'))
    render(<RetryButton onRetry={onRetry} maxRetries={3} />)
    
    const button = screen.getByRole('button')
    
    // First attempt
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Retry (1/3)')).toBeInTheDocument()
    })
  })

  it('shows countdown before retry', async () => {
    const onRetry = jest.fn().mockRejectedValue(new Error('Test error'))
    render(<RetryButton onRetry={onRetry} initialDelay={3000} />)
    
    const button = screen.getByRole('button')
    
    // First attempt fails
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Retry (1/3)')).toBeInTheDocument()
    })
    
    // Second attempt should show countdown
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Retry in 3s')).toBeInTheDocument()
    })
    
    // Advance timer
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    expect(screen.getByText('Retry in 2s')).toBeInTheDocument()
  })

  it('disables button when max retries reached', async () => {
    const onRetry = jest.fn().mockRejectedValue(new Error('Test error'))
    render(<RetryButton onRetry={onRetry} maxRetries={2} />)
    
    const button = screen.getByRole('button')
    
    // First attempt
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Retry (1/2)')).toBeInTheDocument()
    })
    
    // Second attempt
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Retry (2/2)')).toBeInTheDocument()
    })
    
    // Third attempt should show max retries reached
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Max retries reached')).toBeInTheDocument()
      expect(button).toBeDisabled()
    })
  })

  it('calls onRetryAttempt callback', async () => {
    const onRetry = jest.fn().mockRejectedValue(new Error('Test error'))
    const onRetryAttempt = jest.fn()
    
    render(
      <RetryButton 
        onRetry={onRetry} 
        onRetryAttempt={onRetryAttempt}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(onRetryAttempt).toHaveBeenCalledWith(1)
    })
  })

  it('calls onRetryFailed callback', async () => {
    const error = new Error('Test error')
    const onRetry = jest.fn().mockRejectedValue(error)
    const onRetryFailed = jest.fn()
    
    render(
      <RetryButton 
        onRetry={onRetry} 
        onRetryFailed={onRetryFailed}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(onRetryFailed).toHaveBeenCalledWith(error)
    })
  })

  it('calls onRetrySuccess callback', async () => {
    const onRetry = jest.fn().mockResolvedValue('success')
    const onRetrySuccess = jest.fn()
    
    render(
      <RetryButton 
        onRetry={onRetry} 
        onRetrySuccess={onRetrySuccess}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(onRetrySuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows loading state during retry', async () => {
    const onRetry = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    render(<RetryButton onRetry={onRetry} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Retrying...')).toBeInTheDocument()
      expect(button).toBeDisabled()
    })
  })

  it('respects disabled prop', () => {
    const onRetry = jest.fn()
    render(<RetryButton onRetry={onRetry} disabled={true} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('shows remaining attempts', async () => {
    const onRetry = jest.fn().mockRejectedValue(new Error('Test error'))
    render(<RetryButton onRetry={onRetry} maxRetries={3} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('2 attempts remaining')).toBeInTheDocument()
    })
  })
})

describe('useRetry hook', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it('returns initial state', () => {
    const asyncFunction = jest.fn()
    const { result } = renderHook(() => useRetry(asyncFunction))
    
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.error).toBe(null)
    expect(result.current.canRetry).toBe(true)
    expect(result.current.isMaxRetriesReached).toBe(false)
  })

  it('executes function successfully', async () => {
    const asyncFunction = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useRetry(asyncFunction))
    
    let returnValue
    await act(async () => {
      returnValue = await result.current.retry()
    })
    
    expect(returnValue).toBe('success')
    expect(result.current.retryCount).toBe(0)
    expect(result.current.error).toBe(null)
    expect(result.current.isRetrying).toBe(false)
  })

  it('retries on failure with exponential backoff', async () => {
    const error = new Error('Test error')
    const asyncFunction = jest.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success')
    
    const { result } = renderHook(() => 
      useRetry(asyncFunction, { maxRetries: 3, initialDelay: 1000 })
    )
    
    let returnValue
    const retryPromise = act(async () => {
      returnValue = await result.current.retry()
    })
    
    // Advance timers to simulate delays
    act(() => {
      jest.advanceTimersByTime(1000) // First retry delay
    })
    
    act(() => {
      jest.advanceTimersByTime(2000) // Second retry delay (exponential backoff)
    })
    
    await retryPromise
    
    expect(returnValue).toBe('success')
    expect(asyncFunction).toHaveBeenCalledTimes(3)
  })

  it('stops retrying after max attempts', async () => {
    const error = new Error('Test error')
    const asyncFunction = jest.fn().mockRejectedValue(error)
    
    const { result } = renderHook(() => 
      useRetry(asyncFunction, { maxRetries: 2 })
    )
    
    await act(async () => {
      try {
        await result.current.retry()
      } catch (e) {
        // Expected to throw
      }
    })
    
    // Advance timers for all retry attempts
    act(() => {
      jest.advanceTimersByTime(10000)
    })
    
    expect(result.current.retryCount).toBe(3) // Initial + 2 retries
    expect(result.current.isMaxRetriesReached).toBe(true)
    expect(result.current.canRetry).toBe(false)
  })

  it('resets state on reset call', async () => {
    const error = new Error('Test error')
    const asyncFunction = jest.fn().mockRejectedValue(error)
    
    const { result } = renderHook(() => useRetry(asyncFunction))
    
    // Trigger failure
    await act(async () => {
      try {
        await result.current.retry()
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(result.current.retryCount).toBeGreaterThan(0)
    expect(result.current.error).toBe(error)
    
    // Reset
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.retryCount).toBe(0)
    expect(result.current.error).toBe(null)
    expect(result.current.isRetrying).toBe(false)
  })

  it('prevents concurrent retries', async () => {
    const asyncFunction = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    const { result } = renderHook(() => useRetry(asyncFunction))
    
    // Start first retry
    act(() => {
      result.current.retry()
    })
    
    expect(result.current.isRetrying).toBe(true)
    expect(result.current.canRetry).toBe(false)
    
    // Try to start second retry
    const secondRetry = result.current.retry()
    expect(secondRetry).toBeUndefined()
  })
})
import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'fixed' | 'exponential' | 'linear';
  maxDelay?: number;
  jitter?: boolean;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  lastError: Error | null;
  totalAttempts: number;
}

/**
 * Hook for implementing retry logic with exponential backoff and jitter
 */
export const useRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    maxDelay = 30000,
    jitter = true,
    shouldRetry,
    onRetry,
    onMaxAttemptsReached
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    totalAttempts: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateDelay = useCallback((attempt: number): number => {
    let calculatedDelay = delay;

    switch (backoff) {
      case 'exponential':
        calculatedDelay = delay * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        calculatedDelay = delay * attempt;
        break;
      case 'fixed':
      default:
        calculatedDelay = delay;
        break;
    }

    // Apply jitter to prevent thundering herd
    if (jitter) {
      calculatedDelay = calculatedDelay * (0.5 + Math.random() * 0.5);
    }

    // Cap at maxDelay
    return Math.min(calculatedDelay, maxDelay);
  }, [delay, backoff, maxDelay, jitter]);

  const defaultShouldRetry = useCallback((error: Error, attempt: number): boolean => {
    // Don't retry if we've reached max attempts
    if (attempt >= maxAttempts) return false;

    // Default retry conditions
    const retryableErrors = [
      'NetworkError',
      'TypeError', // Often network-related
      'AbortError',
      'TimeoutError'
    ];

    const message = error.message.toLowerCase();
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'fetch',
      'failed to fetch',
      'load failed',
      'server error',
      'service unavailable',
      'too many requests',
      'rate limit'
    ];

    // Check error name
    if (retryableErrors.includes(error.name)) return true;

    // Check error message
    if (retryableMessages.some(keyword => message.includes(keyword))) return true;

    // Check HTTP status codes (if available)
    if ('status' in error) {
      const status = (error as any).status;
      // Retry on 5xx, 408, 429, and some 4xx errors
      if (status >= 500 || status === 408 || status === 429 || status === 502 || status === 503 || status === 504) {
        return true;
      }
    }

    return false;
  }, [maxAttempts]);

  const execute = useCallback(async (...args: T): Promise<R> => {
    // Cancel any ongoing retry attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    let attempt = 0;
    let lastError: Error;

    setState(prev => ({
      ...prev,
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      totalAttempts: 0
    }));

    while (attempt < maxAttempts) {
      attempt++;
      
      setState(prev => ({
        ...prev,
        currentAttempt: attempt,
        totalAttempts: prev.totalAttempts + 1,
        isRetrying: attempt > 1
      }));

      try {
        const result = await fn(...args);
        
        setState(prev => ({
          ...prev,
          isRetrying: false,
          currentAttempt: 0,
          lastError: null
        }));

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          lastError
        }));

        // Check if we should retry
        const shouldRetryAttempt = shouldRetry ? shouldRetry(lastError, attempt) : defaultShouldRetry(lastError, attempt);
        
        if (!shouldRetryAttempt || attempt >= maxAttempts) {
          setState(prev => ({
            ...prev,
            isRetrying: false
          }));

          if (attempt >= maxAttempts && onMaxAttemptsReached) {
            onMaxAttemptsReached(lastError);
          }

          throw lastError;
        }

        // Call retry callback
        if (onRetry) {
          onRetry(lastError, attempt);
        }

        // Wait before retrying
        const retryDelay = calculateDelay(attempt);
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, retryDelay);
          
          // Handle abort
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Retry aborted'));
          });
        });

        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Retry aborted');
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }, [fn, maxAttempts, shouldRetry, defaultShouldRetry, onRetry, onMaxAttemptsReached, calculateDelay]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isRetrying: false
      }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      totalAttempts: 0
    });
  }, [cancel]);

  return {
    execute,
    cancel,
    reset,
    ...state
  };
};

/**
 * Hook for retrying async operations with specific error handling
 */
export const useAsyncRetry = <T>(
  asyncFn: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: RetryOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const { execute, isRetrying, currentAttempt, lastError, totalAttempts } = useRetry(
    asyncFn,
    {
      ...options,
      onRetry: (error, attempt) => {
        console.log(`Retrying operation, attempt ${attempt}:`, error.message);
        options.onRetry?.(error, attempt);
      },
      onMaxAttemptsReached: (error) => {
        console.error('Max retry attempts reached:', error);
        setError(error);
        setLoading(false);
        options.onMaxAttemptsReached?.(error);
      }
    }
  );

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await execute();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [execute]);

  return {
    data,
    error: error || lastError,
    loading: loading || isRetrying,
    retry,
    isRetrying,
    currentAttempt,
    totalAttempts
  };
};

/**
 * Utility function to create a retryable version of any async function
 */
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) => {
  return async (...args: T): Promise<R> => {
    const { maxAttempts = 3, delay = 1000, backoff = 'exponential' } = options;
    
    let attempt = 0;
    let lastError: Error;

    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt >= maxAttempts) {
          throw lastError;
        }

        // Calculate delay
        let retryDelay = delay;
        if (backoff === 'exponential') {
          retryDelay = delay * Math.pow(2, attempt - 1);
        } else if (backoff === 'linear') {
          retryDelay = delay * attempt;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError!;
  };
};

/**
 * Specific retry implementations for common operations
 */

// Retry wrapper for fetch operations
export const retryableFetch = withRetry(
  async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
      error.status = response.status;
      throw error;
    }
    
    return response;
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error: any, attempt: number) => {
      // Retry on network errors and 5xx status codes
      return (
        attempt < 3 && 
        (
          error.name === 'TypeError' ||
          error.name === 'NetworkError' ||
          error.status >= 500 ||
          error.status === 408 ||
          error.status === 429
        )
      );
    }
  }
);

// Retry wrapper for API calls with JSON parsing
export const retryableApiCall = withRetry(
  async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await retryableFetch(url, options);
    return response.json();
  },
  {
    maxAttempts: 3,
    delay: 1500,
    backoff: 'exponential'
  }
);

export default useRetry;
/**
 * Retry utility with exponential backoff.
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (err) => {
      // Retry on 429 (Rate Limit) and 5xx (Server Error)
      const status = err?.status || err?.response?.status;
      return status === 429 || (status >= 500 && status < 600) || !status;
    }
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms due to: ${error.message || error}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

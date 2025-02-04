import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { setTimeout } from "timers/promises";

export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: AxiosError) => {
    // Retry on network errors, rate limits, and 5xx errors
    if (!error.response) return true;
    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600);
  },
};

export class RequestManager {
  private rateLimitMap = new Map<string, number>();
  private readonly minRequestInterval = 100; // ms between requests to same host

  constructor(private readonly retryConfig: RetryConfig = {}) {}

  private async enforceRateLimit(hostname: string): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimitMap.get(hostname) || 0;
    const timeToWait = Math.max(0, lastRequest + this.minRequestInterval - now);

    if (timeToWait > 0) {
      await setTimeout(timeToWait);
    }

    this.rateLimitMap.set(hostname, Date.now());
  }

  private getBackoffDelay(attempt: number): number {
    const config = { ...defaultRetryConfig, ...this.retryConfig };
    const delay = Math.min(
      config.baseDelay * Math.pow(2, attempt),
      config.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay * (0.75 + Math.random() * 0.5);
  }

  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const finalConfig = { ...defaultRetryConfig, ...this.retryConfig };
    let lastError: AxiosError | null = null;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Enforce rate limiting based on hostname
        const hostname = new URL(config.url!).hostname;
        await this.enforceRateLimit(hostname);

        const response = await axios.request<T>(config);
        return response;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          lastError = error;

          // Check if we should retry
          if (
            attempt < finalConfig.maxRetries &&
            finalConfig.shouldRetry(error)
          ) {
            const delay = this.getBackoffDelay(attempt);
            console.warn(
              `Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${
                finalConfig.maxRetries
              }):`,
              error.message
            );
            await setTimeout(delay);
            continue;
          }

          // Format error for better debugging
          throw new APIError(
            `Request failed: ${error.message}`,
            error.response?.status,
            error.response?.data
          );
        }
        throw error;
      }
    }

    // This should never happen due to the throw in the catch block
    throw new APIError(
      `Max retries exceeded: ${lastError?.message || "Unknown error"}`
    );
  }
}

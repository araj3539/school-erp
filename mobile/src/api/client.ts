import { ApiError } from "../auth/api";

export interface RequestPolicy {
  timeoutMs?: number;
  retries?: number;
}

export interface ApiRequestOptions extends RequestInit {
  policy?: RequestPolicy;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_READ_RETRIES = 2;

function withTimeout(signal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

export async function apiRequest<T>(
  request: <R>(path: string, options?: RequestInit) => Promise<R>,
  path: string,
  options: RequestInit = {},
  policy: RequestPolicy = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const retryable = method === "GET" || method === "HEAD" || method === "OPTIONS";
  const retries = retryable ? Math.max(0, policy.retries ?? DEFAULT_READ_RETRIES) : 0;
  const timeoutMs = Math.max(1, policy.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let attempt = 0;
  while (true) {
    const timed = withTimeout(options.signal, timeoutMs);
    try {
      return await request<T>(path, { ...options, signal: timed.signal });
    } catch (error) {
      if (options.signal?.aborted) throw new ApiError(499, "The request was cancelled.");
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
      if (attempt >= retries) {
        if (timed.signal.aborted) throw new ApiError(408, "The request timed out. Please try again.");
        throw error;
      }
      attempt += 1;
    } finally {
      timed.cleanup();
    }
  }
}

export function createApiClient(request: <T>(path: string, options?: RequestInit) => Promise<T>) {
  return {
    get: <T>(path: string, options: ApiRequestOptions = {}) => {
      const { policy, ...requestOptions } = options;
      return apiRequest<T>(request, path, { method: "GET", ...requestOptions }, policy);
    },
    post: <T>(path: string, body: unknown, options: ApiRequestOptions = {}) => {
      const { policy, ...requestOptions } = options;
      return apiRequest<T>(request, path, {
        method: "POST",
        body: JSON.stringify(body),
        ...requestOptions,
      }, policy);
    },
    put: <T>(path: string, body: unknown, options: ApiRequestOptions = {}) => {
      const { policy, ...requestOptions } = options;
      return apiRequest<T>(request, path, {
        method: "PUT",
        body: JSON.stringify(body),
        ...requestOptions,
      }, policy);
    },
    delete: <T>(path: string, options: ApiRequestOptions = {}) => {
      const { policy, ...requestOptions } = options;
      return apiRequest<T>(request, path, { method: "DELETE", ...requestOptions }, policy);
    },
  };
}

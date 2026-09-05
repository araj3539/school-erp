import { ApiError } from "../auth/api";

export interface RequestPolicy {
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_READ_RETRIES = 2;

export async function apiRequest<T>(
  request: <R>(path: string, options?: RequestInit) => Promise<R>,
  path: string,
  options: RequestInit = {},
  policy: RequestPolicy = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const retryable = method === "GET" || method === "HEAD" || method === "OPTIONS";
  const retries = policy.retries ?? (retryable ? DEFAULT_READ_RETRIES : 0);
  const timeoutMs = policy.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await request<T>(path, { ...options, signal: controller.signal });
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
      if (attempt >= retries) {
        if (controller.signal.aborted) throw new ApiError(408, "The request timed out. Please try again.");
        throw error;
      }
      attempt += 1;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createApiClient(request: <T>(path: string, options?: RequestInit) => Promise<T>) {
  return {
    get: <T>(path: string, policy?: RequestPolicy) => apiRequest<T>(request, path, { method: "GET" }, policy),
    post: <T>(path: string, body: unknown, policy?: RequestPolicy) =>
      apiRequest<T>(request, path, { method: "POST", body: JSON.stringify(body) }, policy),
    put: <T>(path: string, body: unknown, policy?: RequestPolicy) =>
      apiRequest<T>(request, path, { method: "PUT", body: JSON.stringify(body) }, policy),
    delete: <T>(path: string, policy?: RequestPolicy) => apiRequest<T>(request, path, { method: "DELETE" }, policy),
  };
}

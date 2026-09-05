import { ApiError } from "../auth/api";

export type ApiErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "session-expired"
  | "not-found"
  | "rate-limited"
  | "server"
  | "network"
  | "cancelled"
  | "timeout"
  | "unknown";

export interface NormalizedApiError {
  kind: ApiErrorKind;
  status: number | null;
  code?: string;
  message: string;
  retryable: boolean;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof ApiError) {
    if (error.status === 408) {
      return { kind: "timeout", status: 408, code: error.code, message: error.message, retryable: true };
    }
    if (error.status === 499) {
      return { kind: "cancelled", status: 499, code: error.code, message: error.message, retryable: false };
    }
    if (error.status === 401) {
      return {
        kind: error.code === "TOKEN_EXPIRED" ? "session-expired" : "unauthorized",
        status: 401,
        code: error.code,
        message: error.message,
        retryable: false,
      };
    }
    if (error.status === 403) return { kind: "forbidden", status: 403, code: error.code, message: error.message, retryable: false };
    if (error.status === 404) return { kind: "not-found", status: 404, code: error.code, message: error.message, retryable: false };
    if (error.status === 422) return { kind: "validation", status: 422, code: error.code, message: error.message, retryable: false };
    if (error.status === 429) return { kind: "rate-limited", status: 429, code: error.code, message: error.message, retryable: true };
    if (error.status >= 500) return { kind: "server", status: error.status, code: error.code, message: error.message, retryable: true };

    return { kind: "unknown", status: error.status, code: error.code, message: error.message, retryable: false };
  }

  if (error instanceof Error) {
    return { kind: "network", status: null, message: error.message || "Network request failed.", retryable: true };
  }

  return { kind: "unknown", status: null, message: "An unexpected error occurred.", retryable: false };
}

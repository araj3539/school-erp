import type {
  AuthResponse,
  LoginCredentials,
  MobileUser,
  RefreshResponse,
} from "./types";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string; code?: string })
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error ?? `Request failed with status ${response.status}`,
      body?.code,
    );
  }

  return body as T;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
  schoolId?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (schoolId) headers.set("X-School-Id", schoolId);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse<T>(response);
}

export function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function refresh(refreshToken: string): Promise<RefreshResponse> {
  return request<RefreshResponse>("/auth/mobile/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function getCurrentUser(accessToken: string, schoolId?: string | null): Promise<{ user: MobileUser }> {
  return request<{ user: MobileUser }>("/auth/me", {}, accessToken, schoolId);
}

export function logout(accessToken: string, schoolId?: string | null): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/logout", {
    method: "POST",
  }, accessToken, schoolId);
}

export function requestWithAccessToken<T>(
  path: string,
  options: RequestInit = {},
  accessToken: string,
  schoolId?: string | null,
): Promise<T> {
  return request<T>(path, options, accessToken, schoolId);
}

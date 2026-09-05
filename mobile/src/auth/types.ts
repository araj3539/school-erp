import type { UserRole } from "@school-erp/shared";

export interface MobileUser {
  id: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  lastLogin?: string;
}

export interface SchoolSummary {
  id: string;
  name: string;
  code: string;
}

export interface AuthResponse {
  user: MobileUser;
  accessToken: string;
  refreshToken: string;
  schools?: SchoolSummary[];
  activeSchoolId?: string | null;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  schoolCode?: string;
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

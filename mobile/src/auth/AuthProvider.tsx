import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { ApiError, getCurrentUser, login as loginRequest, logout as logoutRequest, refresh as refreshRequest, requestWithAccessToken } from "./api";
import { clearRefreshToken, readRefreshToken, writeRefreshToken } from "./storage";
import type { AuthResponse, LoginCredentials, MobileUser, SchoolSummary, SessionStatus } from "./types";

interface AuthContextValue {
  status: SessionStatus;
  user: MobileUser | null;
  schools: SchoolSummary[];
  activeSchoolId: string | null;
  accessToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  selectSchool: (schoolId: string | null) => void;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<MobileUser | null>(null);
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshInFlight = useRef<Promise<string> | null>(null);

  const applyAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const invalidateSession = useCallback(async () => {
    await clearRefreshToken();
    applyAccessToken(null);
    setUser(null);
    setSchools([]);
    setActiveSchoolId(null);
    setStatus("unauthenticated");
  }, [applyAccessToken]);

  const refreshSession = useCallback(async (): Promise<string> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const operation = (async () => {
      const storedRefreshToken = await readRefreshToken();
      if (!storedRefreshToken) throw new ApiError(401, "No mobile refresh session");

      const response = await refreshRequest(storedRefreshToken);
      await writeRefreshToken(response.refreshToken);
      applyAccessToken(response.accessToken);
      return response.accessToken;
    })();

    refreshInFlight.current = operation;
    try {
      return await operation;
    } finally {
      refreshInFlight.current = null;
    }
  }, [applyAccessToken]);

  const bootstrap = useCallback(async () => {
    try {
      const token = await refreshSession();
      const response = await getCurrentUser(token, activeSchoolId);
      setUser(response.user);
      setStatus("authenticated");
    } catch {
      await invalidateSession();
    }
  }, [activeSchoolId, invalidateSession, refreshSession]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response: AuthResponse = await loginRequest(credentials);
    await writeRefreshToken(response.refreshToken);
    applyAccessToken(response.accessToken);
    setUser(response.user);
    setSchools(response.schools ?? []);
    setActiveSchoolId(response.activeSchoolId ?? null);
    setStatus("authenticated");
  }, [applyAccessToken]);

  const logout = useCallback(async () => {
    const token = accessTokenRef.current;
    try {
      if (token) await logoutRequest(token, activeSchoolId);
    } finally {
      await invalidateSession();
    }
  }, [activeSchoolId, invalidateSession]);

  const selectSchool = useCallback((schoolId: string | null) => {
    if (schoolId && !schools.some((school) => school.id === schoolId)) {
      throw new Error("Selected school is not available to this session");
    }
    setActiveSchoolId(schoolId);
  }, [schools]);

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = accessTokenRef.current ?? await refreshSession();

    try {
      return await requestWithAccessToken<T>(path, options, token, activeSchoolId);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;

      try {
        const renewedToken = await refreshSession();
        return await requestWithAccessToken<T>(path, options, renewedToken, activeSchoolId);
      } catch (refreshError) {
        await invalidateSession();
        throw refreshError;
      }
    }
  }, [activeSchoolId, invalidateSession, refreshSession]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    schools,
    activeSchoolId,
    accessToken,
    login,
    logout,
    selectSchool,
    request,
  }), [accessToken, activeSchoolId, login, logout, request, schools, selectSchool, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

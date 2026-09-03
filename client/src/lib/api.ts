import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://school-erp-api-6gm7.onrender.com/api/v1";
const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: 30_000 });
api.interceptors.request.use((config) => {
  const { user, activeSchoolId } = useAuthStore.getState();
  if (user?.role === "super_admin" && activeSchoolId) config.headers.set("X-School-Id", activeSchoolId);
  return config;
});
api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  const requestUrl = originalRequest?.url ?? "";
  const isAuthRequest = ["/auth/login", "/auth/refresh", "/auth/logout"].includes(requestUrl);
  if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
    originalRequest._retry = true;
    try { await api.post("/auth/refresh"); return api(originalRequest); }
    catch { useAuthStore.getState().logout(); return Promise.reject(error); }
  }
  return Promise.reject(error);
});

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "The server is taking too long to respond. Please try again.";
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message) return data.message;
      if (typeof data.error === "string" && data.error) return data.error;
    }
    if (!error.response) return "Unable to reach the server. Check your connection and try again.";
    if (error.response.status === 403) return "You do not have permission to perform this action.";
    return fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
export default api;

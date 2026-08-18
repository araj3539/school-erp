import axios from "axios";
import { useAuthStore } from "../store/authStore";

// In production, fall back to the live Render API if VITE_API_URL is not
// configured in Vercel. The environment variable can still override this
// value for staging/local deployments.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://school-erp-api-6gm7.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRequest = ["/auth/login", "/auth/refresh", "/auth/logout"].includes(requestUrl);

    // Never try to refresh a login/refresh/logout request itself. In
    // particular, a failed refresh must not recursively call /auth/refresh.
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const response = await api.post("/auth/refresh");
        const { accessToken } = response.data;
        useAuthStore.getState().updateAccessToken(accessToken);
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

import axios from "axios";
import { useAuthStore } from "../store/authStore";

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

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

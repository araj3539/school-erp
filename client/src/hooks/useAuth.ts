import { useAuthStore } from "../store/authStore";
export function useAuth() {
  const { user, isAuthenticated, login, logout, updateAccessToken, hasPermission, hasAnyPermission } = useAuthStore();
  return { user, isAuthenticated, login, logout, updateAccessToken, hasPermission, hasAnyPermission };
}


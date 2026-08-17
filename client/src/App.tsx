import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/Toaster";
import { useUIStore } from "./store/uiStore";
import { router } from "./routes/routes";
import { useEffect } from "react";
import api from "./lib/api";
import { useAuthStore } from "./store/authStore";

function App() {
  const { toasts, removeToast } = useUIStore();
  const { isAuthenticated, accessToken, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) {
      useAuthStore.persist.rehydrate();
    }
  }, [hasHydrated]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [isAuthenticated, accessToken]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;

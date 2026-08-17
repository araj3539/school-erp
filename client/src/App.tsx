import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/Toaster";
import { useUIStore } from "./store/uiStore";
import { router } from "./routes/routes";
import { useEffect } from "react";
import api from "./lib/api";
import { useAuthStore } from "./store/authStore";

function App() {
  const { toasts, removeToast } = useUIStore();
  const { isAuthenticated, user, hasHydrated, setHasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) {
      useAuthStore.persist.rehydrate();
    }
  }, [hasHydrated]);

  useEffect(() => {
    if (isAuthenticated && user?.accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${user.accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      setHasHydrated(true);
    }
  }, [hasHydrated, isAuthenticated, setHasHydrated]);

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

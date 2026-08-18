import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/Toaster";
import { useUIStore } from "./store/uiStore";
import { router } from "./routes/routes";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

function App() {
  const { toasts, removeToast } = useUIStore();
  const { hasHydrated, initializeAuth } = useAuthStore();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

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

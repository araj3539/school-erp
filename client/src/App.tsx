import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/Toaster";
import { useUIStore } from "./store/uiStore";
import { router } from "./routes/routes";
import { useEffect } from "react";
import api from "./lib/api";
import { useAuthStore } from "./store/authStore";

function App() {
  const { toasts, removeToast } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated && user) {
      api.defaults.headers.common["Authorization"] = `Bearer ${(user as any).accessToken}`;
    }
  }, [isAuthenticated, user]);
  return (
    <>
      <RouterProvider router={router} />
      <Toaster toasts={toasts} onClose={removeToast} />
    </>
  );
}
export default App;

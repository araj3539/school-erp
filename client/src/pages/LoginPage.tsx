import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useUIStore } from "../store/uiStore";

const loginSchema = z.object({
  schoolCode: z.string().trim().max(30, "Invalid school code").regex(/^$|^[A-Za-z0-9-]+$/, "Use only letters, numbers and hyphens").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const schoolCode = data.schoolCode?.trim().toUpperCase();
      const response = await api.post("/auth/login", { email: data.email.trim().toLowerCase(), password: data.password, ...(schoolCode ? { schoolCode } : {}) });
      login(response.data.user, { activeSchoolId: response.data.activeSchoolId, schools: response.data.schools });
      addToast("Login successful", "success");
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error.code === "ECONNABORTED" ? "The server is taking too long to respond. Please try again." : error.response?.data?.error || "Login failed";
      addToast(message, "error");
    } finally { setIsLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Secure sign in</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use your school account details to continue to the management workspace.</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Input label="School Code" type="text" {...register("schoolCode")} error={errors.schoolCode?.message} hint="Required for school accounts. Platform Super Admin can leave this empty." placeholder="SCH-1234ABCD" autoComplete="organization" autoCapitalize="characters" />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} placeholder="admin@school.com" autoComplete="email" />
        <Input label="Password" type="password" {...register("password")} error={errors.password?.message} placeholder="Enter your password" autoComplete="current-password" />
        <Button type="submit" className="w-full" loading={isLoading}>{isLoading ? "Signing in..." : "Sign in"}</Button>
      </div>

      <p className="text-center text-xs leading-5 text-slate-400">Access is protected by your assigned role and school permissions.</p>
    </form>
  );
}

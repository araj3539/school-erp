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
import { ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  schoolCode: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
  const savedSchoolCode = typeof window !== "undefined" ? localStorage.getItem("saved_school_code") || "" : "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      schoolCode: savedSchoolCode,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const payload = {
        email: data.email.trim(),
        password: data.password,
        schoolCode: isSuperAdminMode ? undefined : data.schoolCode?.trim() || undefined,
      };

      const response = await api.post("/auth/login", payload);
      const user = response.data.data.user;
      login(user);

      if (data.schoolCode && !isSuperAdminMode) {
        localStorage.setItem("saved_school_code", data.schoolCode.trim());
      }

      addToast("Signed in successfully", "success");
      navigate(from, { replace: true });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Invalid credentials. Please verify your school code, email, and password.";
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="text-sm text-slate-600 leading-normal">
          Enter your institutional credentials to access your portal.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {!isSuperAdminMode ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="schoolCode" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                School Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsSuperAdminMode(true);
                  setValue("schoolCode", "");
                }}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
              >
                Platform staff?
              </button>
            </div>
            <Input
              id="schoolCode"
              type="text"
              {...register("schoolCode")}
              error={errors.schoolCode?.message}
              placeholder="e.g. SCH-1042"
              autoComplete="organization"
              autoCapitalize="characters"
              hint="Provided by your school administration."
            />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <ShieldCheck className="h-4 w-4 text-slate-600 shrink-0" aria-hidden="true" />
              <span>Platform Administration</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSuperAdminMode(false)}
              className="font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              School login
            </button>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            placeholder="name@school.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Password
          </label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2 h-11 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all"
          loading={isLoading}
        >
          {isLoading ? "Signing in..." : "Continue"}
        </Button>
      </form>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-500">
          Need help signing in? Contact your institution IT helpdesk.
        </p>
      </div>
    </div>
  );
}

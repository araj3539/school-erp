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
import { KeyRound } from "lucide-react";

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
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const setDemoRole = (role: "admin" | "principal" | "teacher" | "student" | "parent" | "accountant") => {
    const demos = {
      admin: { schoolCode: "", email: "admin@school.com" },
      principal: { schoolCode: "SCH-DEMO", email: "principal@school.com" },
      teacher: { schoolCode: "SCH-DEMO", email: "teacher@school.com" },
      student: { schoolCode: "SCH-DEMO", email: "student@school.com" },
      parent: { schoolCode: "SCH-DEMO", email: "parent@school.com" },
      accountant: { schoolCode: "SCH-DEMO", email: "accountant@school.com" },
    };
    const demo = demos[role];
    setValue("schoolCode", demo.schoolCode, { shouldValidate: true });
    setValue("email", demo.email, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      login(response.data.data.user);
      addToast("Signed in successfully", "success");
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid credentials. Please verify your school code, email, and password.";
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">Secure Access</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter your credentials to enter your school workspace.</p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick role fill</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDemoRole("admin")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setDemoRole("teacher")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => setDemoRole("student")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setDemoRole("parent")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Parent
          </button>
          <button
            type="button"
            onClick={() => setDemoRole("accountant")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Accountant
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <Input
          label="School Code"
          type="text"
          {...register("schoolCode")}
          error={errors.schoolCode?.message}
          hint="Required for school staff, students and parents. Super Admin can omit."
          placeholder="SCH-1234ABCD"
          autoComplete="organization"
          autoCapitalize="characters"
        />
        <Input
          label="Email Address"
          type="email"
          {...register("email")}
          error={errors.email?.message}
          placeholder="user@school.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full mt-2" loading={isLoading}>
          {isLoading ? "Signing in..." : "Sign in to workspace"}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-400">
        <KeyRound className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        <span>Role-enforced authentication with HTTPS encrypted sessions</span>
      </div>
    </form>
  );
}

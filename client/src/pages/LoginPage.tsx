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
import { KeyRound, ChevronDown, Sparkles, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  schoolCode: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ROLES = [
  {
    category: "Administration & Oversight",
    roles: [
      { id: "super_admin", label: "Super Admin", email: "admin@school.com", code: "" },
      { id: "principal", label: "Principal", email: "principal@school.com", code: "SCH-DEMO" },
      { id: "accountant", label: "Accountant", email: "accountant@school.com", code: "SCH-DEMO" },
      { id: "support_admin", label: "Support Admin", email: "support@school.com", code: "" },
    ],
  },
  {
    category: "Faculty & Staff",
    roles: [
      { id: "teacher", label: "Teacher", email: "teacher@school.com", code: "SCH-DEMO" },
    ],
  },
  {
    category: "Students & Families",
    roles: [
      { id: "student", label: "Student", email: "student@school.com", code: "SCH-DEMO" },
      { id: "parent", label: "Parent", email: "parent@school.com", code: "SCH-DEMO" },
    ],
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
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

  const selectDemoRole = (role: { email: string; code: string }) => {
    setValue("schoolCode", role.code, { shouldValidate: true });
    setValue("email", role.email, { shouldValidate: true });
    setValue("password", "Password123!", { shouldValidate: true });
    setIsSuperAdminMode(!role.code);
    setShowDemoSelector(false);
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
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
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
          <Sparkles className="h-3 w-3" aria-hidden="true" /> Universal Sign In
        </span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          One unified portal for all roles. Workspace permissions are detected and routed automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        {!isSuperAdminMode ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="schoolCode" className="text-sm font-semibold text-slate-700">
                School Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsSuperAdminMode(true);
                  setValue("schoolCode", "");
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Platform staff?
              </button>
            </div>
            <Input
              id="schoolCode"
              type="text"
              {...register("schoolCode")}
              error={errors.schoolCode?.message}
              placeholder="e.g. SCH-1234"
              autoComplete="organization"
              autoCapitalize="characters"
              hint="Required for school staff, teachers, students, and parents."
            />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs">
            <div className="flex items-center gap-2 text-sky-800 font-medium">
              <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0" />
              <span>Platform Admin Mode (School code bypassed)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSuperAdminMode(false)}
              className="font-bold text-sky-700 underline hover:text-sky-900"
            >
              School login
            </button>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          {...register("email")}
          error={errors.email?.message}
          placeholder="your.email@school.com"
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
          {isLoading ? "Signing in..." : "Continue to workspace"}
        </Button>
      </form>

      {/* Collapsible Demo Helper for testing all 7 roles without cluttering the UI */}
      <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3">
        <button
          type="button"
          onClick={() => setShowDemoSelector(!showDemoSelector)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Quick Demo & Testing Accounts (7 roles)
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${showDemoSelector ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {showDemoSelector && (
          <div className="mt-3 space-y-3 pt-3 border-t border-slate-200/60">
            {DEMO_ROLES.map((group) => (
              <div key={group.category}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {group.category}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => selectDemoRole(role)}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                    >
                      <span className="truncate">{role.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">fill</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs leading-5 text-slate-400">
        Protected by role-based access control and tenant encryption.
      </p>
    </div>
  );
}

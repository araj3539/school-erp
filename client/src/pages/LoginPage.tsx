import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { useUIStore } from "../store/uiStore";

const loginSchema = z.object({
  schoolCode: z.string().trim().min(3, "School code is required").max(30, "Invalid school code").regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers and hyphens"),
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
  const from = (location.state as any)?.from?.pathname || "/dashboard";
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        ...data,
        schoolCode: data.schoolCode.trim().toUpperCase()
      });
      login(response.data.user);
      addToast("Login successful", "success");
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error.code === "ECONNABORTED"
        ? "The server is taking too long to respond. Please try again."
        : error.response?.data?.error || "Login failed";
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-500 mt-1">Sign in to your school's account</p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-6">
          <Input
            label="School Code"
            type="text"
            {...register("schoolCode")}
            error={errors.schoolCode?.message}
            placeholder="SCH-1234ABCD"
            autoComplete="organization"
          />
          <Input
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            placeholder="admin@school.com"
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

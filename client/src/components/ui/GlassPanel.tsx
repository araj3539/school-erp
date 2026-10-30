import React from "react";
import { cn } from "../../utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "strong";
}

export function GlassPanel({ children, className, intensity = "medium" }: GlassPanelProps) {
  const backdrop = {
    light: "backdrop-blur-sm bg-white/80",
    medium: "backdrop-blur-md bg-white/60",
    strong: "backdrop-blur-xl bg-white/40",
  }[intensity];

  const border = {
    light: "border border-white/60",
    medium: "border border-white/40",
    strong: "border border-white/20",
  }[intensity];

  return (
    <div className={cn("rounded-2xl relative", backdrop, border, className)}>{children}</div>
  );
}

interface GlowOrbProps {
  color?: "primary" | "violet" | "emerald" | "amber" | "rose" | "cyan";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function GlowOrb({ color = "primary", size = "lg", className }: GlowOrbProps) {
  const colors = {
    primary: "bg-primary-500/40 blur-[120px]",
    violet: "bg-violet-500/40 blur-[120px]",
    emerald: "bg-emerald-500/40 blur-[120px]",
    amber: "bg-amber-500/40 blur-[120px]",
    rose: "bg-rose-500/40 blur-[120px]",
    cyan: "bg-cyan-500/40 blur-[120px]",
  }[color];

  const sizes = {
    sm: "h-32 w-32",
    md: "h-48 w-48",
    lg: "h-64 w-64",
    xl: "h-96 w-96",
  }[size];

  return (
    <div className={cn("absolute rounded-full opacity-60 pointer-events-none", colors, sizes, className)} />
  );
}

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}

export function GradientBorder({ children, className, colors = ["#3b82f6", "#1d4ed8", "#8b5cf6"] }: GradientBorderProps) {
  return (
    <div className={cn("rounded-2xl relative p-[1px] bg-gradient-to-r", className)}>
      <div className="relative flex h-full w-full rounded-[calc(1.5rem-1px)] bg-white p-1">
        {children}
      </div>
      <style>{`
        .gradient-border-bg {
          background: linear-gradient(90deg, ${colors.join(", ")});
        }
      `}</style>
      <div className="absolute inset-0 -m-[1px] rounded-2xl bg-gradient-to-r from-primary-500 via-violet-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
    </div>
  );
}

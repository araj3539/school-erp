import { PropsWithChildren, useRef } from "react";
import { cn } from "../../utils";

export function Magnetic({ children, className, strength = 0.18 }: PropsWithChildren<{ className?: string; strength?: number }>) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * strength;
    const y = (event.clientY - rect.top - rect.height / 2) * strength;
    ref.current?.style.setProperty("transform", `translate3d(${x}px, ${y}px, 0)`);
  };
  const reset = () => ref.current?.style.setProperty("transform", "translate3d(0, 0, 0)");

  return <div ref={ref} onPointerMove={move} onPointerLeave={reset} className={cn("magnetic-item", className)}>{children}</div>;
}

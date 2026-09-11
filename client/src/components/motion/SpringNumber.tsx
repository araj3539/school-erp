import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils";

export function SpringNumber({ value, formatter = (next: number) => Math.round(next).toLocaleString("en-IN"), className }: { value: number; formatter?: (value: number) => string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const from = current.current;
    const delta = value - from;
    if (!delta) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 420, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + delta * eased;
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={cn("tabular-nums", className)}>{formatter(display)}</span>;
}

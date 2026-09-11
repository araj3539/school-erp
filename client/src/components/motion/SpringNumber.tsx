import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { cn } from "../../utils";

const defaultFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export function SpringNumber({ value, formatter, className }: { value: number; formatter?: (value: number) => string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    const from = current.current;
    if (reduced || from === value) { current.current = value; setDisplay(value); return; }
    const controls = animate(from, value, { type: "spring", stiffness: 170, damping: 22, mass: 0.65, onUpdate: (latest) => { current.current = latest; setDisplay(latest); } });
    return () => controls.stop();
  }, [value, reduced]);
  return <span className={cn("tabular-nums", className)} aria-live="polite">{formatter ? formatter(display) : defaultFormatter.format(display)}</span>;
}

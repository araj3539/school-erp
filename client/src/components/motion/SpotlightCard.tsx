import { PropsWithChildren, useRef } from "react";
import { cn } from "../../utils";

export function SpotlightCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  const frame = useRef<number | null>(null);
  const node = useRef<HTMLDivElement | null>(null);

  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    if (frame.current != null) cancelAnimationFrame(frame.current);
    const target = event.currentTarget;
    const nextX = event.clientX;
    const nextY = event.clientY;
    frame.current = requestAnimationFrame(() => {
      node.current?.style.setProperty("--spotlight-x", `${nextX - target.getBoundingClientRect().left}px`);
      node.current?.style.setProperty("--spotlight-y", `${nextY - target.getBoundingClientRect().top}px`);
      node.current?.style.setProperty("--spotlight-opacity", "1");
    });
  };

  return <div ref={node} onPointerMove={update} onPointerLeave={() => node.current?.style.setProperty("--spotlight-opacity", "0")} className={cn("spotlight-card", className)}>{children}</div>;
}

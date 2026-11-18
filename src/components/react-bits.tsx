import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Adapted from React Bits Spotlight Card. */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  };
  return <div ref={ref} onPointerMove={move} className={cn("spotlight-card", className)}>{children}</div>;
}

export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("gradient-text", className)}>{children}</span>;
}

export function AnimatedContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("content-enter", className)}>{children}</div>;
}

export function Glow({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cn("ambient-glow", className)} style={style} />;
}

import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "default" | "success" | "warn" | "danger" | "info";

export function Badge({
  className,
  tone = "default",
  ...p
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    default: "border-border-strong text-text-muted bg-surface-2",
    success: "border-green/30 text-green bg-[rgba(16,185,129,0.10)]",
    warn: "border-orange/30 text-orange bg-[rgba(245,158,11,0.10)]",
    danger: "border-rose/30 text-rose bg-[rgba(244,63,94,0.10)]",
    info: "border-cyan/30 text-cyan bg-[rgba(34,211,238,0.10)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...p}
    />
  );
}

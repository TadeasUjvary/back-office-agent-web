import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "default" | "success" | "warn" | "danger" | "info";

export function Badge({
  className,
  tone = "default",
  ...p
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    default: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...p}
    />
  );
}

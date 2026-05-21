import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "default" | "success" | "warn" | "danger" | "info";

export function Badge({
  className,
  tone = "default",
  ...p
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    default: "border-hairline-strong text-ink-muted bg-paper-deep/60",
    success: "border-[#9CB99D] text-[#2F5B3D] bg-[#E8EFE7]",
    warn: "border-[#D6BC6A] text-[#73580F] bg-[#F0E7CC]",
    danger: "border-[#C77373] text-[#7A1E1E] bg-[#F2DCDB]",
    info: "border-[#9FB1B9] text-[#28404C] bg-[#DCE6EA]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...p}
    />
  );
}

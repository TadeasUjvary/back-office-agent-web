import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary:
      "bg-accent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:bg-accent-bright",
    secondary:
      "border border-border-strong bg-surface text-text hover:bg-surface-2 hover:border-border-bright",
    ghost: "text-text-muted hover:bg-surface hover:text-text",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

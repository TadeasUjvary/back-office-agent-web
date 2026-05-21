import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper";
  const variants: Record<Variant, string> = {
    primary: "bg-ink text-paper hover:bg-ink-2",
    secondary: "border border-hairline-strong bg-transparent text-ink hover:bg-paper-deep",
    ghost: "text-ink-muted hover:bg-paper-deep hover:text-ink",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

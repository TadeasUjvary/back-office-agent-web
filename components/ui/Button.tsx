import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
  const variants: Record<Variant, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
    ghost: "text-zinc-700 hover:bg-zinc-100",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

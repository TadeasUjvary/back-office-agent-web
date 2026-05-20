"use client";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500",
        checked ? "bg-emerald-500" : "bg-zinc-300",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

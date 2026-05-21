import { cn } from "@/lib/cn";
import type { ComponentPropsWithRef } from "react";

export function Card({ className, ref, ...p }: ComponentPropsWithRef<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-surface lift",
        className,
      )}
      {...p}
    />
  );
}
export function CardHeader({ className, ...p }: ComponentPropsWithRef<"div">) {
  return <div className={cn("border-b border-border px-5 py-4", className)} {...p} />;
}
export function CardTitle({ className, ...p }: ComponentPropsWithRef<"h3">) {
  return (
    <h3
      className={cn(
        "text-[15px] font-semibold tracking-tight text-text",
        className,
      )}
      {...p}
    />
  );
}
export function CardBody({ className, ...p }: ComponentPropsWithRef<"div">) {
  return <div className={cn("px-5 py-4", className)} {...p} />;
}

"use client";
import { cn } from "@/lib/cn";
import { INTEGRATIONS, type IntegrationId } from "@/lib/integrations";
import { ShieldCheck } from "lucide-react";

type Size = "sm" | "md";

/** Compact source pill used inline next to chat tool results. */
export function IntegrationBadge({
  id,
  size = "sm",
  showVendor = false,
  prefix = "Zdroj",
}: {
  id: IntegrationId;
  size?: Size;
  showVendor?: boolean;
  prefix?: string;
}) {
  const ig = INTEGRATIONS[id];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold",
          ig.badgeBg, ig.badgeText,
          size === "sm" ? "size-3.5 text-[8px]" : "size-4 text-[9px]",
        )}
      >
        {ig.glyph}
      </span>
      <span className="font-medium text-zinc-700">
        {prefix}: <span className="text-zinc-900">{ig.name}</span>
      </span>
      {showVendor && (
        <span className="text-zinc-400">· {ig.vendor}</span>
      )}
      <ShieldCheck className="size-3 text-emerald-600" aria-label="Mocked connection" />
    </span>
  );
}

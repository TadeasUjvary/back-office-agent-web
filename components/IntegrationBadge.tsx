"use client";
import { cn } from "@/lib/cn";
import { INTEGRATIONS, type IntegrationId } from "@/lib/integrations";

/** Typographic source pill — flat, no shadow, just a hairline. */
export function IntegrationBadge({
  id,
  prefix = "Zdroj",
}: {
  id: IntegrationId;
  prefix?: string;
}) {
  const ig = INTEGRATIONS[id];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 border border-hairline-strong bg-paper px-1.5 py-[2px] font-mono text-[10px] uppercase tracking-wider text-ink-muted",
    )}>
      <span className="text-copper">●</span>
      {prefix}: <span className="text-ink">{ig.name}</span>
    </span>
  );
}

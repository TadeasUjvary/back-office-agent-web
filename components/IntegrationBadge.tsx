"use client";
import { INTEGRATIONS, type IntegrationId } from "@/lib/integrations";

const TONE_BY_ID: Record<IntegrationId, string> = {
  sheets: "text-green",
  drive: "text-orange",
  calendar: "text-cyan",
  gmail: "text-rose",
  crm: "text-accent-bright",
};

/** Compact source pill next to chat tool results. */
export function IntegrationBadge({
  id,
  prefix = "Zdroj",
}: {
  id: IntegrationId;
  prefix?: string;
}) {
  const ig = INTEGRATIONS[id];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-[3px] font-mono text-[10px] uppercase tracking-wider text-text-muted">
      <span className={TONE_BY_ID[id]}>●</span>
      {prefix}: <span className="text-text">{ig.name}</span>
    </span>
  );
}

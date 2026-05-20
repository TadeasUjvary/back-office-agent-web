"use client";
import { ClientsBySourceChart } from "@/components/generative/ClientsBySourceChart";
import { TrendChart } from "@/components/generative/TrendChart";
import { EmailDraft } from "@/components/generative/EmailDraft";
import { AuditTable } from "@/components/generative/AuditTable";
import { ReportSlides } from "@/components/generative/ReportSlides";
import { BriefingCard } from "@/components/generative/BriefingCard";
import { Loader2 } from "lucide-react";

type ToolUIPart = {
  type: `tool-${string}`;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const TOOL_LABELS: Record<string, string> = {
  "tool-getNewClients": "Načítám nové klienty…",
  "tool-getLeadsAndSalesTrend": "Počítám trend leadů a prodejů…",
  "tool-proposeViewingSlots": "Hledám volné termíny v kalendáři…",
  "tool-auditMissingRenovationData": "Procházím databázi nemovitostí…",
  "tool-weeklyReport": "Sestavuji týdenní report…",
  "tool-setupMarketMonitoring": "Nastavuji ranní monitoring…",
};

export function ToolPart({ part }: { part: ToolUIPart }) {
  const label = TOOL_LABELS[part.type] ?? "Volám nástroj…";

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        <Loader2 className="size-4 animate-spin text-indigo-600" />
        {label}
      </div>
    );
  }

  if (part.state === "output-error") {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Chyba toolu: {part.errorText ?? "neznámá chyba"}
      </div>
    );
  }

  const output = part.output as never;
  switch (part.type) {
    case "tool-getNewClients":
      return (
        <ClientsBySourceChart
          data={output}
          chartType={(output as { chartType: "pie" | "bar" }).chartType}
        />
      );
    case "tool-getLeadsAndSalesTrend":
      return <TrendChart data={output} />;
    case "tool-proposeViewingSlots":
      return <EmailDraft data={output} />;
    case "tool-auditMissingRenovationData":
      return <AuditTable data={output} />;
    case "tool-weeklyReport":
      return <ReportSlides data={output} />;
    case "tool-setupMarketMonitoring":
      return <BriefingCard data={output} />;
    default:
      return (
        <pre className="overflow-auto rounded-lg bg-zinc-50 p-3 text-xs">
          {JSON.stringify(output, null, 2)}
        </pre>
      );
  }
}

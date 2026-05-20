"use client";
import { ClientsBySourceChart } from "@/components/generative/ClientsBySourceChart";
import { TrendChart } from "@/components/generative/TrendChart";
import { EmailDraft } from "@/components/generative/EmailDraft";
import { AuditTable } from "@/components/generative/AuditTable";
import { ReportSlides } from "@/components/generative/ReportSlides";
import { BriefingCard } from "@/components/generative/BriefingCard";
import { AgentsList } from "@/components/generative/AgentsList";
import { PropertyQueryResultCard } from "@/components/generative/PropertyQueryResult";
import { IntegrationBadge } from "@/components/IntegrationBadge";
import { sourcesFor } from "@/lib/integrations";
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
  "tool-listAgents": "Načítám tým makléřů…",
  "tool-queryProperties": "Filtruji databázi nemovitostí…",
};

export function ToolPart({ part }: { part: ToolUIPart }) {
  const label = TOOL_LABELS[part.type] ?? "Volám nástroj…";
  const toolName = part.type.replace(/^tool-/, "");
  const sources = sourcesFor(toolName);

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="space-y-1.5">
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <IntegrationBadge key={s.id} id={s.id} prefix="Čtu z" />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          <Loader2 className="size-4 animate-spin text-indigo-600" />
          {label}
        </div>
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
  let component: React.ReactNode;
  switch (part.type) {
    case "tool-getNewClients":
      component = (
        <ClientsBySourceChart
          data={output}
          chartType={(output as { chartType: "pie" | "bar" }).chartType}
        />
      );
      break;
    case "tool-getLeadsAndSalesTrend":
      component = <TrendChart data={output} />;
      break;
    case "tool-proposeViewingSlots":
      component = <EmailDraft data={output} />;
      break;
    case "tool-auditMissingRenovationData":
      component = <AuditTable data={output} />;
      break;
    case "tool-weeklyReport":
      component = <ReportSlides data={output} />;
      break;
    case "tool-setupMarketMonitoring":
      component = <BriefingCard data={output} />;
      break;
    case "tool-listAgents":
      component = <AgentsList data={output} />;
      break;
    case "tool-queryProperties":
      component = <PropertyQueryResultCard data={output} />;
      break;
    default:
      component = (
        <pre className="overflow-auto rounded-lg bg-zinc-50 p-3 text-xs">
          {JSON.stringify(output, null, 2)}
        </pre>
      );
  }

  return (
    <div className="space-y-2">
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <IntegrationBadge key={s.id} id={s.id} />
          ))}
        </div>
      )}
      {component}
    </div>
  );
}

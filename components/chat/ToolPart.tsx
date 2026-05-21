"use client";
import { ClientsBySourceChart } from "@/components/generative/ClientsBySourceChart";
import { TrendChart } from "@/components/generative/TrendChart";
import { EmailDraft } from "@/components/generative/EmailDraft";
import { AuditTable } from "@/components/generative/AuditTable";
import { ReportSlides } from "@/components/generative/ReportSlides";
import { BriefingCard } from "@/components/generative/BriefingCard";
import { AgentsList } from "@/components/generative/AgentsList";
import { PropertyQueryResultCard } from "@/components/generative/PropertyQueryResult";
import { SimpleTable } from "@/components/generative/SimpleTable";
import { LeadFunnelChart } from "@/components/generative/LeadFunnelChart";
import {
  SendEmailResult, CalendarEventResult, CRMNoteResult, UrgeAgentResult,
  ExportSheetResult, FetchUrlResult, ComparePeriodsResult,
} from "@/components/generative/ActionResult";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IntegrationBadge } from "@/components/IntegrationBadge";
import { sourcesFor } from "@/lib/integrations";
import { Loader2, BadgeCheck } from "lucide-react";
import { czCurrency } from "@/lib/format";

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
  "tool-queryLeads": "Filtruji leady…",
  "tool-queryClients": "Filtruji klienty…",
  "tool-querySales": "Agreguji prodeje…",
  "tool-getPropertyDetail": "Načítám detail nemovitosti…",
  "tool-getAgentDetail": "Načítám profil makléře…",
  "tool-getLeadFunnel": "Skládám konverzní trychtýř…",
  "tool-comparePeriods": "Porovnávám období…",
  "tool-sendEmail": "Odesílám e-mail přes Gmail…",
  "tool-createCalendarEvent": "Zakládám událost v Google Calendar…",
  "tool-logCRMNote": "Zapisuji poznámku do CRM…",
  "tool-urgeAgent": "Posílám urgenci makléři…",
  "tool-exportToSheet": "Exportuji do Google Sheets…",
  "tool-fetchUrl": "Stahuji obsah z webu…",
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
    case "tool-queryLeads": {
      const d = output as { total: number; matched: number; byStatus: { status: string; count: number }[]; bySource: { source: string; count: number }[]; rows: { id: number; full_name: string; email: string; phone: string; status: string; source: string; region: string; agent: string; property_interest: string; created_at: string }[] };
      component = (
        <SimpleTable
          title="Leady — výsledek dotazu"
          subtitle={`${d.matched} z ${d.total} leadů`}
          topBadges={[
            ...d.byStatus.slice(0, 5).map((s) => ({ label: `${s.status}: ${s.count}`, tone: "info" as const })),
            ...d.bySource.slice(0, 3).map((s) => ({ label: `${s.source}: ${s.count}`, tone: "default" as const })),
          ]}
          columns={[
            { key: "full_name", label: "Jméno" },
            { key: "status", label: "Stav" },
            { key: "source", label: "Zdroj" },
            { key: "region", label: "Region" },
            { key: "agent", label: "Makléř" },
            { key: "property_interest", label: "Zájem" },
            { key: "created_at", label: "Vytvořen" },
          ]}
          rows={d.rows}
        />
      );
      break;
    }
    case "tool-queryClients": {
      const d = output as { total: number; matched: number; byType: { type: string; count: number }[]; bySource: { source: string; count: number }[]; rows: { id: number; full_name: string; email: string; phone: string; type: string; source: string; region: string; created_at: string }[] };
      component = (
        <SimpleTable
          title="Klienti — výsledek dotazu"
          subtitle={`${d.matched} z ${d.total} klientů`}
          topBadges={[
            ...d.byType.map((s) => ({ label: `${s.type}: ${s.count}`, tone: "info" as const })),
            ...d.bySource.slice(0, 3).map((s) => ({ label: `${s.source}: ${s.count}`, tone: "default" as const })),
          ]}
          columns={[
            { key: "full_name", label: "Jméno" },
            { key: "type", label: "Typ" },
            { key: "source", label: "Zdroj" },
            { key: "region", label: "Region" },
            { key: "email", label: "E-mail" },
            { key: "created_at", label: "Vytvořen" },
          ]}
          rows={d.rows}
        />
      );
      break;
    }
    case "tool-querySales": {
      const d = output as { total: number; matched: number; volume: number; commission: number; avgPrice: number; byAgent: { agent: string; count: number; volume: number; commission: number }[]; byDistrict: { district: string; count: number; volume: number }[]; rows: { id: number; ref_code: string; address: string; district: string; sale_price_czk: number; commission_czk: number; agent: string; closed_at: string }[] };
      component = (
        <SimpleTable
          title="Prodeje — výsledek dotazu"
          subtitle={`${d.matched} z ${d.total} prodejů · objem ${czCurrency(d.volume)} · Ø ${czCurrency(d.avgPrice)} · provize ${czCurrency(d.commission)}`}
          topBadges={[
            ...d.byAgent.slice(0, 3).map((a) => ({ label: `${a.agent}: ${a.count}× / ${czCurrency(a.volume)}`, tone: "info" as const })),
          ]}
          columns={[
            { key: "ref_code", label: "Kód" },
            { key: "address", label: "Adresa" },
            { key: "district", label: "Lokalita" },
            { key: "sale_price_czk", label: "Cena", align: "right", render: (r) => czCurrency(r.sale_price_czk) },
            { key: "commission_czk", label: "Provize", align: "right", render: (r) => czCurrency(r.commission_czk) },
            { key: "agent", label: "Makléř" },
            { key: "closed_at", label: "Uzavřeno" },
          ]}
          rows={d.rows}
        />
      );
      break;
    }
    case "tool-getPropertyDetail": {
      const d = output as { found: boolean; refCode?: string; property?: { ref_code: string; address: string; district: string; type: string; price_czk: number; area_m2: number; status: string; energy_class: string; renovation_year: number | null; construction_modifications: string | null; has_renovation_data: number }; agent?: string; owner?: { name: string; email: string; phone: string } | null; sale?: { sale_price_czk: number; commission_czk: number; closed_at: string } | null };
      if (!d.found) {
        component = (
          <Card><CardBody className="text-sm">Nemovitost {d.refCode} nenalezena.</CardBody></Card>
        );
        break;
      }
      const p = d.property!;
      component = (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-indigo-600" />
              {p.ref_code} · {p.type}
            </CardTitle>
            <p className="mt-1 text-xs text-zinc-500">{p.address} · {p.district}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={p.status === "nabízí se" ? "warn" : p.status === "prodáno" ? "success" : "info"}>{p.status}</Badge>
              <Badge>Energetická třída {p.energy_class}</Badge>
              <Badge tone={p.has_renovation_data ? "success" : "danger"}>
                {p.has_renovation_data ? "Data o rekonstrukci ✓" : "Chybí data o rekonstrukci"}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <Field label="Cena" value={czCurrency(p.price_czk)} />
            <Field label="Plocha" value={`${p.area_m2} m²`} />
            <Field label="Makléř" value={d.agent ?? "—"} />
            {p.renovation_year && <Field label="Rok rekonstrukce" value={String(p.renovation_year)} />}
            {p.construction_modifications && <Field label="Úpravy" value={p.construction_modifications} span2 />}
            {d.owner && <Field label="Vlastník" value={`${d.owner.name} · ${d.owner.email} · ${d.owner.phone}`} span3 />}
            {d.sale && (
              <Field
                label="Prodej"
                value={`${czCurrency(d.sale.sale_price_czk)} (provize ${czCurrency(d.sale.commission_czk)}) · ${d.sale.closed_at}`}
                span3
              />
            )}
          </CardBody>
        </Card>
      );
      break;
    }
    case "tool-getAgentDetail": {
      const d = output as { found: boolean; agentName?: string; agent?: { name: string; email: string }; properties?: { total: number; active: number; reserved: number; sold: number; missingRenovation: number }; sales?: { count: number; volume: number; commission: number }; recentSales?: { ref_code: string; address: string; sale_price_czk: number; closed_at: string }[]; activeListings?: { ref_code: string; address: string; type: string; price_czk: number }[] };
      if (!d.found) {
        component = <Card><CardBody className="text-sm">Makléř {d.agentName} nenalezen.</CardBody></Card>;
        break;
      }
      component = (
        <Card>
          <CardHeader>
            <CardTitle>{d.agent!.name}</CardTitle>
            <p className="text-xs text-zinc-500">{d.agent!.email}</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Field label="Prodejů" value={String(d.sales!.count)} />
              <Field label="Objem" value={czCurrency(d.sales!.volume)} />
              <Field label="Provize" value={czCurrency(d.sales!.commission)} />
              <Field label="Aktivní inzeráty" value={`${d.properties!.active} / ${d.properties!.total}`} />
              <Field label="Rezervováno" value={String(d.properties!.reserved)} />
              <Field label="Prodáno" value={String(d.properties!.sold)} />
              <Field label="Chybí data" value={String(d.properties!.missingRenovation)} />
            </div>
            {d.recentSales!.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Posledních {d.recentSales!.length} prodejů</p>
                <ul className="space-y-1 text-sm">
                  {d.recentSales!.map((s) => (
                    <li key={s.ref_code + s.closed_at} className="flex justify-between">
                      <span>{s.ref_code} · {s.address}</span>
                      <span className="tabular-nums text-zinc-600">{czCurrency(s.sale_price_czk)} · {s.closed_at.slice(0, 10)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {d.activeListings!.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Aktivní inzeráty</p>
                <ul className="space-y-1 text-sm">
                  {d.activeListings!.map((p) => (
                    <li key={p.ref_code} className="flex justify-between">
                      <span>{p.ref_code} · {p.type} · {p.address}</span>
                      <span className="tabular-nums text-zinc-600">{czCurrency(p.price_czk)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      );
      break;
    }
    case "tool-getLeadFunnel":
      component = <LeadFunnelChart data={output} />;
      break;
    case "tool-comparePeriods":
      component = <ComparePeriodsResult data={output} />;
      break;
    case "tool-sendEmail":
      component = <SendEmailResult data={output} />;
      break;
    case "tool-createCalendarEvent":
      component = <CalendarEventResult data={output} />;
      break;
    case "tool-logCRMNote":
      component = <CRMNoteResult data={output} />;
      break;
    case "tool-urgeAgent":
      component = <UrgeAgentResult data={output} />;
      break;
    case "tool-exportToSheet":
      component = <ExportSheetResult data={output} />;
      break;
    case "tool-fetchUrl":
      component = <FetchUrlResult data={output} />;
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

function Field({ label, value, span2, span3 }: { label: string; value: React.ReactNode; span2?: boolean; span3?: boolean }) {
  return (
    <div className={span3 ? "md:col-span-3 col-span-2" : span2 ? "col-span-2" : undefined}>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-medium text-zinc-900 break-words">{value}</p>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { RefreshCw, ExternalLink, ShieldCheck } from "lucide-react";
import { INTEGRATIONS, type IntegrationId } from "@/lib/integrations";
import { czShortDate } from "@/lib/format";

type Status = { connected: boolean; account: string; lastSync: string; itemCount: string };

const DEFAULTS: Record<IntegrationId, Status> = {
  sheets: { connected: true, account: "pepa@realityholding.cz", lastSync: "2026-05-17", itemCount: "180 nemovitostí · 407 leadů · 179 klientů" },
  drive:  { connected: true, account: "pepa@realityholding.cz", lastSync: "2026-05-17", itemCount: "Sdílený disk Reality Holding (4 složky)" },
  calendar:{ connected: true, account: "pepa@realityholding.cz", lastSync: "2026-05-17", itemCount: "21 nadcházejících událostí · prac. doba 09–18" },
  gmail:  { connected: true, account: "pepa@realityholding.cz", lastSync: "2026-05-17", itemCount: "Šablona prohlídky · 2 podpisy" },
  crm:    { connected: true, account: "Reality Holding · API key", lastSync: "2026-05-17", itemCount: "5 makléřů · monitoring 3 portálů" },
};

const TONE_BY_ID: Record<IntegrationId, string> = {
  sheets: "from-green to-emerald-400",
  drive: "from-orange to-amber-400",
  calendar: "from-cyan to-sky-400",
  gmail: "from-rose to-pink-400",
  crm: "from-accent to-accent-bright",
};

export default function IntegrationsPage() {
  const ids = Object.keys(INTEGRATIONS) as IntegrationId[];
  const [state, setState] = useState<Record<IntegrationId, Status>>(DEFAULTS);
  const [syncing, setSyncing] = useState<IntegrationId | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem("integrations"); if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("integrations", JSON.stringify(state)); } catch {} }, [state]);

  const toggle = (id: IntegrationId, v: boolean) =>
    setState((s) => ({ ...s, [id]: { ...s[id], connected: v } }));

  const reSync = (id: IntegrationId) => {
    setSyncing(id);
    setTimeout(() => { setState((s) => ({ ...s, [id]: { ...s[id], lastSync: "2026-05-17" } })); setSyncing(null); }, 900);
  };

  const connectedCount = ids.filter((id) => state[id].connected).length;

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow="Settings · integrace"
        title="Připojené systémy"
        description="Mockované propojení s Google Workspace a interním CRM. Agent skrz tyto integrace čte a zapisuje data místo aby si je vymýšlel."
        right={
          <div className="text-right">
            <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-text">
              {connectedCount}<span className="text-text-dim">/{ids.length}</span>
            </p>
            <p className="eyebrow mt-1">aktivních</p>
          </div>
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        {/* Demo mode banner */}
        <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
          <div className="flex-1 text-[13px] leading-relaxed">
            <p className="font-medium text-text">Demo režim — všechna spojení jsou mockovaná.</p>
            <p className="mt-0.5 text-text-muted">
              UI ukazuje produktovou architekturu integrací. Agent ve skutečnosti čte z lokální JSON datové vrstvy (seed=42).
              Pro produkci by se připojilo přes OAuth (Google) a privátní API klíče (CRM).
            </p>
          </div>
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ids.map((id) => {
            const ig = INTEGRATIONS[id];
            const s = state[id];
            return (
              <Card key={id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${TONE_BY_ID[id]} text-[14px] font-bold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]`}>
                      {ig.glyph}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">{ig.vendor}</p>
                      <CardTitle className="mt-0.5">{ig.name}</CardTitle>
                    </div>
                    <Switch
                      checked={s.connected}
                      onChange={(v) => toggle(id, v)}
                      label={`${ig.name} ${s.connected ? "odpojit" : "připojit"}`}
                    />
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-[13px] leading-relaxed text-text-muted">{ig.description}</p>

                  <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 text-[12px]">
                    <Field label="Účet" value={s.account} />
                    <Field label="Poslední sync" value={s.connected ? czShortDate(s.lastSync) : "—"} />
                    <Field label="Obsah" value={s.itemCount} span2 />
                  </dl>

                  <div className="flex flex-wrap gap-1">
                    {ig.scopes.map((sc) => (
                      <Badge key={sc} className="lowercase">{sc}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    {s.connected ? (
                      <Badge tone="success">aktivní (mock)</Badge>
                    ) : (
                      <Badge tone="danger">odpojeno</Badge>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => reSync(id)}
                      disabled={syncing === id || !s.connected}
                      className="text-xs"
                    >
                      <RefreshCw className={`size-3 ${syncing === id ? "animate-spin" : ""}`} />
                      {syncing === id ? "Sync…" : "Znovu načíst"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Where agent uses each integration */}
        <Card>
          <CardHeader>
            <p className="eyebrow">Workflow</p>
            <CardTitle className="mt-1">Kde agent integrace volá</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul>
              <UsageRow tool="getNewClients · getLeadsAndSalesTrend · auditMissingRenovationData · queryProperties · queryLeads · queryClients · querySales" via={["Google Sheets", "Firemní CRM"]} note="Tabulkové dotazy nad databází nemovitostí, leadů, klientů a prodejů." />
              <UsageRow tool="proposeViewingSlots · createCalendarEvent" via={["Google Calendar", "Gmail"]} note="Volné termíny z Pepova kalendáře + zápis nové schůzky." />
              <UsageRow tool="sendEmail · urgeAgent" via={["Gmail"]} note="Odeslání e-mailu klientovi nebo urgence makléři." />
              <UsageRow tool="weeklyReport · exportToSheet" via={["Google Sheets", "Google Drive"]} note="Agregace KPI ze Sheetů a export reportů do Drive." />
              <UsageRow tool="setupMarketMonitoring · listAgents · logCRMNote" via={["Firemní CRM"]} note="Interní endpoint — seznam makléřů, monitoring portálů, zápisy poznámek." />
              <UsageRow tool="fetchUrl" via={["Web — direct HTTP"]} note="Veřejné HTTP GET (žádná integrace). Server-side fetch s SSRF guardem." />
            </ul>
          </CardBody>
        </Card>

        {/* OAuth placeholder */}
        <Card>
          <CardHeader>
            <p className="eyebrow">Roadmap</p>
            <CardTitle className="mt-1">Přidat další integraci</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Slack", "Microsoft 365", "HubSpot", "Sreality API"].map((name) => (
              <button
                key={name}
                disabled
                className="rounded-lg border border-dashed border-border-strong bg-surface-2/40 p-4 text-left text-[13px] text-text-muted hover:bg-surface-2"
              >
                <ExternalLink className="mb-2 size-3.5 text-text-dim" />
                <p className="text-[14px] font-medium tracking-tight text-text">{name}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim">Brzy</p>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : undefined}>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-text-dim">{label}</dt>
      <dd className="mt-1 text-text-2">{value}</dd>
    </div>
  );
}

function UsageRow({ tool, via, note }: { tool: string; via: string[]; note: string }) {
  return (
    <li className="border-b border-border px-5 py-4 last:border-b-0">
      <p className="font-mono text-[10px] text-accent-bright break-words">{tool}</p>
      <p className="mt-1.5 text-[13px] text-text-2">{note}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {via.map((v) => (<Badge key={v} tone="info">{v}</Badge>))}
      </div>
    </li>
  );
}

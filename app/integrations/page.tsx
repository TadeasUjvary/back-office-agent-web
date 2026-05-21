"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { RefreshCw, ExternalLink } from "lucide-react";
import { INTEGRATIONS, type IntegrationId } from "@/lib/integrations";
import { czShortDate } from "@/lib/format";

type Status = {
  connected: boolean;
  account: string;
  lastSync: string;
  itemCount: string;
};

const DEFAULTS: Record<IntegrationId, Status> = {
  sheets: {
    connected: true,
    account: "pepa@realityholding.cz",
    lastSync: "2026-05-17",
    itemCount: "180 nemovitostí · 407 leadů · 179 klientů",
  },
  drive: {
    connected: true,
    account: "pepa@realityholding.cz",
    lastSync: "2026-05-17",
    itemCount: "Sdílený disk Reality Holding (4 složky)",
  },
  calendar: {
    connected: true,
    account: "pepa@realityholding.cz",
    lastSync: "2026-05-17",
    itemCount: "21 nadcházejících událostí · prac. doba 09–18",
  },
  gmail: {
    connected: true,
    account: "pepa@realityholding.cz",
    lastSync: "2026-05-17",
    itemCount: "Šablona prohlídky · 2 podpisy",
  },
  crm: {
    connected: true,
    account: "Reality Holding interní · API key",
    lastSync: "2026-05-17",
    itemCount: "5 makléřů · monitoring 3 portálů",
  },
};

export default function IntegrationsPage() {
  const ids = Object.keys(INTEGRATIONS) as IntegrationId[];
  const [state, setState] = useState<Record<IntegrationId, Status>>(DEFAULTS);
  const [syncing, setSyncing] = useState<IntegrationId | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("integrations");
      if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("integrations", JSON.stringify(state)); } catch {}
  }, [state]);

  const toggle = (id: IntegrationId, v: boolean) =>
    setState((s) => ({ ...s, [id]: { ...s[id], connected: v } }));

  const reSync = (id: IntegrationId) => {
    setSyncing(id);
    setTimeout(() => {
      setState((s) => ({ ...s, [id]: { ...s[id], lastSync: "2026-05-17" } }));
      setSyncing(null);
    }, 900);
  };

  const connectedCount = ids.filter((id) => state[id].connected).length;

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        num="04"
        eyebrow="Settings · integrace"
        title={
          <>
            Připojené <em className="not-italic text-copper">systémy</em>
          </>
        }
        description={
          <>
            Mockované propojení s Google Workspace a interním CRM. Agent skrz tyto integrace
            čte a zapisuje data místo aby si je vymýšlel. Reálné nasazení by používalo OAuth a privátní API klíče.
          </>
        }
        right={
          <div className="text-right">
            <p className="display text-[36px] leading-none tracking-tight">
              {connectedCount}<span className="text-ink-faint">/{ids.length}</span>
            </p>
            <p className="eyebrow mt-1">aktivních</p>
          </div>
        }
      />

      <div className="mx-auto max-w-6xl space-y-10 px-10 py-10">
        {/* Demo mode banner */}
        <div className="border-l-2 border-copper bg-card px-6 py-5">
          <p className="eyebrow text-copper">Demo režim</p>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-2">
            Všechna spojení jsou mockovaná. UI ukazuje produktovou architekturu integrací — agent ve skutečnosti čte z lokální JSON datové vrstvy (seed=42).
            Pro produkční nasazení bychom propojili přes <span className="font-mono text-ink">OAuth (Google)</span> a privátní <span className="font-mono text-ink">API klíče (CRM)</span>.
          </p>
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ids.map((id) => {
            const ig = INTEGRATIONS[id];
            const s = state[id];
            return (
              <Card key={id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="font-mono text-[28px] leading-none text-copper">
                      {ig.glyph}
                    </div>
                    <div className="flex-1">
                      <p className="eyebrow">{ig.vendor}</p>
                      <CardTitle className="mt-1">{ig.name}</CardTitle>
                    </div>
                    <Switch
                      checked={s.connected}
                      onChange={(v) => toggle(id, v)}
                      label={`${ig.name} ${s.connected ? "odpojit" : "připojit"}`}
                    />
                  </div>
                </CardHeader>
                <CardBody className="space-y-5">
                  <p className="text-[13px] leading-relaxed text-ink-muted">{ig.description}</p>

                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-hairline py-4 text-[12px]">
                    <Field label="Účet" value={s.account} />
                    <Field label="Poslední sync" value={s.connected ? czShortDate(s.lastSync) : "—"} />
                    <Field label="Obsah" value={s.itemCount} span2 />
                  </dl>

                  <div className="flex flex-wrap gap-1.5">
                    {ig.scopes.map((sc) => (
                      <Badge key={sc} className="lowercase">{sc}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline pt-4">
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
              <UsageRow
                tool="getNewClients · getLeadsAndSalesTrend · auditMissingRenovationData · queryProperties · queryLeads · queryClients · querySales"
                via={["Google Sheets", "Firemní CRM"]}
                note="Tabulkové dotazy nad databází nemovitostí, leadů, klientů a prodejů."
              />
              <UsageRow
                tool="proposeViewingSlots · createCalendarEvent"
                via={["Google Calendar", "Gmail"]}
                note="Volné termíny z Pepova kalendáře + zápis nové schůzky."
              />
              <UsageRow
                tool="sendEmail · urgeAgent"
                via={["Gmail"]}
                note="Odeslání e-mailu klientovi nebo urgence makléři."
              />
              <UsageRow
                tool="weeklyReport · exportToSheet"
                via={["Google Sheets", "Google Drive"]}
                note="Agregace KPI ze Sheetů a export reportů do Drive."
              />
              <UsageRow
                tool="setupMarketMonitoring · listAgents · logCRMNote"
                via={["Firemní CRM"]}
                note="Interní endpoint — seznam makléřů, monitoring portálů, zápisy poznámek."
              />
              <UsageRow
                tool="fetchUrl"
                via={["Web — direct HTTP"]}
                note="Veřejné HTTP GET (žádná integrace). Server-side fetch s SSRF guardem."
              />
            </ul>
          </CardBody>
        </Card>

        {/* OAuth placeholder */}
        <Card>
          <CardHeader>
            <p className="eyebrow">Roadmap</p>
            <CardTitle className="mt-1">Přidat další integraci</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-4">
            {["Slack", "Microsoft 365", "HubSpot", "Sreality API"].map((name) => (
              <button
                key={name}
                disabled
                className="bg-card p-5 text-left text-[13px] text-ink-muted hover:bg-paper-deep"
              >
                <ExternalLink className="mb-3 size-3.5 text-ink-faint" />
                <p className="font-display text-[16px] tracking-tight text-ink">{name}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink-faint">Brzy</p>
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
      <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-1 text-ink-2">{value}</dd>
    </div>
  );
}

function UsageRow({ tool, via, note }: { tool: string; via: string[]; note: string }) {
  return (
    <li className="border-b border-hairline px-6 py-5 last:border-b-0">
      <p className="font-mono text-[10px] text-copper break-words">{tool}</p>
      <p className="mt-2 text-[14px] text-ink-2">{note}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {via.map((v) => (
          <Badge key={v} tone="info">{v}</Badge>
        ))}
      </div>
    </li>
  );
}

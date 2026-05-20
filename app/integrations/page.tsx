"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import {
  Plug, ShieldCheck, RefreshCw, ExternalLink, Database, MailCheck,
} from "lucide-react";
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

  // Persist locally — feels real.
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
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Plug className="size-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-zinc-900">Integrace</h1>
            <p className="text-sm text-zinc-600">
              Připojení k Google Workspace a firemnímu CRM. Agent skrz ně čte a zapisuje data místo aby si je vymýšlel.
            </p>
          </div>
          <Badge tone="success">{connectedCount} / {ids.length} připojeno</Badge>
        </header>

        {/* Demo mode banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">Demo režim — všechna spojení jsou mockovaná.</p>
            <p className="mt-0.5 text-amber-800">
              UI ukazuje produktovou architekturu integrací. Agent ve skutečnosti čte z lokální JSON datové vrstvy (seed=42). Pro produkční nasazení bychom propojili přes OAuth (Google) a privátní API klíče (CRM).
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
                <CardHeader className="flex items-start gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${ig.badgeBg} ${ig.badgeText}`}
                  >
                    {ig.glyph}
                  </div>
                  <div className="flex-1">
                    <CardTitle>{ig.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-zinc-500">{ig.vendor}</p>
                  </div>
                  <Switch
                    checked={s.connected}
                    onChange={(v) => toggle(id, v)}
                    label={`${ig.name} ${s.connected ? "odpojit" : "připojit"}`}
                  />
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-sm text-zinc-700">{ig.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <Row label="Účet" value={s.account} />
                    <Row
                      label="Poslední sync"
                      value={s.connected ? czShortDate(s.lastSync) : "—"}
                    />
                    <Row label="Obsah" value={s.itemCount} span2 />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ig.scopes.map((sc) => (
                      <Badge key={sc} tone="default" className="font-mono text-[10px]">
                        {sc}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
                    {s.connected ? (
                      <>
                        <Badge tone="success">
                          <ShieldCheck className="mr-1 size-3" />
                          Připojeno (mock)
                        </Badge>
                        <Button
                          variant="secondary"
                          onClick={() => reSync(id)}
                          disabled={syncing === id}
                          className="ml-auto text-xs"
                        >
                          <RefreshCw className={`size-3 ${syncing === id ? "animate-spin" : ""}`} />
                          {syncing === id ? "Synchronizuji…" : "Znovu načíst"}
                        </Button>
                      </>
                    ) : (
                      <Badge tone="danger">Odpojeno</Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Where the agent uses each integration */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Database className="size-4 text-indigo-600" />
            <CardTitle>Kde agent integrace využívá</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm text-zinc-700">
              <UsageRow
                tool="getNewClients · getLeadsAndSalesTrend · auditMissingRenovationData · queryProperties"
                via={["Google Sheets", "Firemní CRM"]}
                note="Tabulkové dotazy nad databází nemovitostí, leadů, klientů a prodejů."
              />
              <UsageRow
                tool="proposeViewingSlots"
                via={["Google Calendar", "Gmail"]}
                note="Volné termíny z Pepova kalendáře + návrh emailu jako draft v Gmailu."
              />
              <UsageRow
                tool="weeklyReport"
                via={["Google Sheets", "Google Drive"]}
                note="Agreguje KPI ze Sheetů a exportuje 3-slide deck do Drive."
              />
              <UsageRow
                tool="setupMarketMonitoring · listAgents"
                via={["Firemní CRM"]}
                note="Interní endpoint — seznam makléřů, monitoring realitních portálů."
              />
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <MailCheck className="size-3.5" />
              U každé odpovědi v chatu je viditelný štítek „Zdroj: …" — vidíte odkud agent data čerpal.
            </p>
          </CardBody>
        </Card>

        {/* OAuth placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Přidat další integraci</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Slack", "Microsoft 365", "HubSpot", "Sreality API"].map((name) => (
              <button
                key={name}
                disabled
                className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-3 text-sm text-zinc-500 hover:bg-zinc-50"
              >
                <ExternalLink className="mb-2 size-4" />
                {name}
                <p className="mt-0.5 text-[10px] uppercase tracking-wide">Brzy</p>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : undefined}>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-medium text-zinc-800">{value}</p>
    </div>
  );
}

function UsageRow({ tool, via, note }: { tool: string; via: string[]; note: string }) {
  return (
    <li className="rounded-lg border border-zinc-100 bg-zinc-50/40 p-3">
      <p className="font-mono text-xs text-indigo-700">{tool}</p>
      <p className="mt-1 text-zinc-700">{note}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {via.map((v) => (
          <Badge key={v} tone="info">{v}</Badge>
        ))}
      </div>
    </li>
  );
}

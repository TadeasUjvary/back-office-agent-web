import { loadAll } from "@/data/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Database } from "lucide-react";
import { czCurrency } from "@/lib/format";

export default function DataPage() {
  const { agents, sources, leads, clients, properties, sales, calendar, feed, briefings } = loadAll();
  const missing = properties.filter((p) => p.has_renovation_data === 0).length;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Database className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Datová vrstva</h1>
            <p className="text-sm text-zinc-600">
              Syntetická data, seed=42, referenční datum 2026-05-17. Read-only přehled — agent k nim přistupuje výhradně skrz Function Calling.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Nemovitosti" value={String(properties.length)} sub={`${missing} bez dat o rekonstrukci`} />
          <Stat label="Leady" value={String(leads.length)} sub="14 měsíců historie" />
          <Stat label="Klienti" value={String(clients.length)} sub={`${clients.filter((c) => c.type === "prodávající").length} prodávajících / ${clients.filter((c) => c.type === "kupující").length} kupujících`} />
          <Stat label="Prodeje" value={String(sales.length)} sub={`celkem ${czCurrency(sales.reduce((a, s) => a + s.sale_price_czk, 0))}`} />
          <Stat label="Makléři" value={String(agents.length)} />
          <Stat label="Zdroje leadů" value={String(sources.length)} />
          <Stat label="Kalendář" value={String(calendar.events.length)} sub={`Pepa · ${calendar.timezone}`} />
          <Stat label="Tržní feed" value={String(feed.listings.length)} sub={`${briefings.length} ranních briefingů`} />
        </div>

        <Card>
          <CardHeader><CardTitle>Nemovitosti (prvních 15)</CardTitle></CardHeader>
          <CardBody className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Kód</th>
                  <th className="px-3 py-2 text-left">Adresa</th>
                  <th className="px-3 py-2 text-left">Typ</th>
                  <th className="px-3 py-2 text-right">Cena</th>
                  <th className="px-3 py-2 text-left">Stav</th>
                  <th className="px-3 py-2 text-left">Reno</th>
                </tr>
              </thead>
              <tbody>
                {properties.slice(0, 15).map((p) => (
                  <tr key={p.id} className="border-t border-zinc-100">
                    <td className="px-3 py-2 font-mono text-xs">{p.ref_code}</td>
                    <td className="px-3 py-2">{p.address}</td>
                    <td className="px-3 py-2 text-zinc-600">{p.type}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{czCurrency(p.price_czk)}</td>
                    <td className="px-3 py-2"><Badge tone={p.status === "prodáno" ? "success" : p.status === "rezervováno" ? "info" : "warn"}>{p.status}</Badge></td>
                    <td className="px-3 py-2">{p.has_renovation_data ? <Badge tone="success">✓</Badge> : <Badge tone="danger">chybí</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Makléři</CardTitle></CardHeader>
          <CardBody>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((a) => (
                <li key={a.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                  <p className="text-sm font-medium text-zinc-900">{a.name}</p>
                  <p className="text-xs text-zinc-500">{a.email}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

import { loadAll } from "@/data/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { czCurrency } from "@/lib/format";

export default function DataPage() {
  const { agents, sources, leads, clients, properties, sales, calendar, feed, briefings } = loadAll();
  const missing = properties.filter((p) => p.has_renovation_data === 0).length;
  const totalSalesVolume = sales.reduce((a, s) => a + s.sale_price_czk, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow="Datová vrstva · read-only"
        title="Syntetický dataset"
        description={
          <>
            Generováno deterministicky (<span className="font-mono">seed=42</span>, ref. datum{" "}
            <span className="font-mono">2026-05-17</span>). Agent k těmto datům přistupuje výhradně skrz Function Calling — žádná halucinace.
          </>
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Nemovitosti" big={String(properties.length)} sub={`${missing} bez dat o rekonstrukci`} />
          <Stat label="Leady" big={String(leads.length)} sub="14 měsíců historie" />
          <Stat label="Klienti" big={String(clients.length)} sub={`${clients.filter((c) => c.type === "prodávající").length} prodávajících / ${clients.filter((c) => c.type === "kupující").length} kupujících`} />
          <Stat label="Prodeje" big={String(sales.length)} sub={`celkem ${czCurrency(totalSalesVolume)}`} />
          <Stat label="Makléři" big={String(agents.length)} />
          <Stat label="Zdroje leadů" big={String(sources.length)} />
          <Stat label="Kalendář" big={String(calendar.events.length)} sub={`Pepa · ${calendar.timezone}`} />
          <Stat label="Tržní feed" big={String(feed.listings.length)} sub={`${briefings.length} briefingů`} />
        </div>

        <Card>
          <CardHeader>
            <p className="eyebrow">Vzorek</p>
            <CardTitle className="mt-1">Nemovitosti — prvních 15</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-strong">
                  <Th>Kód</Th><Th>Adresa</Th><Th>Typ</Th><Th align="right">Cena</Th><Th>Stav</Th><Th>Reno</Th>
                </tr>
              </thead>
              <tbody>
                {properties.slice(0, 15).map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-surface-2/40">
                    <Td><span className="font-mono text-[12px] text-text-2">{p.ref_code}</span></Td>
                    <Td>{p.address}</Td>
                    <Td><span className="text-text-muted">{p.type}</span></Td>
                    <Td align="right"><span className="font-mono tabular-nums">{czCurrency(p.price_czk)}</span></Td>
                    <Td>
                      <Badge tone={p.status === "prodáno" ? "success" : p.status === "rezervováno" ? "info" : "warn"}>
                        {p.status}
                      </Badge>
                    </Td>
                    <Td>{p.has_renovation_data ? <Badge tone="success">vyplněno</Badge> : <Badge tone="danger">chybí</Badge>}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="eyebrow">Tým</p>
            <CardTitle className="mt-1">Makléři</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul>
              {agents.map((a, idx) => (
                <li key={a.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tabular-nums text-text-dim w-6">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] font-medium text-text">{a.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-text-faint">{a.email}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, big, sub }: { label: string; big: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 lift">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em] text-text">
        {big}
      </p>
      {sub && <p className="mt-2 font-mono text-[10px] text-text-faint leading-relaxed">{sub}</p>}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-5 py-2.5 text-${align} font-mono text-[10px] uppercase tracking-wider text-text-dim`}
    >
      {children}
    </th>
  );
}
function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <td className={`px-5 py-2.5 text-${align}`}>{children}</td>;
}

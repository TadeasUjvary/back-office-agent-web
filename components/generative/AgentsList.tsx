"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AgentsResult } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

export function AgentsList({ data }: { data: AgentsResult }) {
  const sorted = [...data.agents].sort((a, b) => b.salesCount - a.salesCount);
  const topVolume = Math.max(...sorted.map((a) => a.salesVolume), 1);
  return (
    <Card>
      <CardHeader>
        <p className="eyebrow">Reality Holding · tým</p>
        <CardTitle className="mt-1">Makléři</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <ol>
          {sorted.map((a, idx) => (
            <li key={a.id} className="border-b border-border px-5 py-4 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2 font-mono text-[11px] tabular-nums text-text-muted">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-semibold tracking-tight text-text">
                        {a.name}
                      </p>
                      {idx === 0 && <Badge tone="info">top</Badge>}
                    </div>
                    <p className="font-mono text-[10px] text-text-faint">{a.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[18px] font-semibold leading-none tracking-[-0.02em] text-text">
                    {a.salesCount}
                  </p>
                  <p className="eyebrow mt-1">prodejů</p>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-[12px] md:grid-cols-4">
                <Field label="Objem" value={czCurrency(a.salesVolume)} />
                <Field label="Provize" value={czCurrency(a.commission)} />
                <Field label="Ø cena" value={a.salesCount ? czCurrency(a.avgSalePrice) : "—"} />
                <Field label="Aktivní inzeráty" value={`${a.activeListings} / ${a.totalListings}`} />
              </dl>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright"
                    style={{ width: `${(a.salesVolume / topVolume) * 100}%` }}
                  />
                </div>
                {a.missingRenovation > 0 && (
                  <Badge tone="warn">{a.missingRenovation} bez dat</Badge>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 md:block">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-text-dim">{label}</dt>
      <dd className="font-mono text-[12px] tabular-nums whitespace-nowrap text-text md:mt-0.5">{value}</dd>
    </div>
  );
}

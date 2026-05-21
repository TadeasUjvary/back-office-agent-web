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
        <p className="eyebrow">Tým · Reality Holding</p>
        <CardTitle className="mt-1">Makléři</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <ol>
          {sorted.map((a, idx) => (
            <li key={a.id} className="border-b border-hairline px-6 py-5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-[11px] tabular-nums text-ink-faint w-8">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-[18px] tracking-tight text-ink">
                      {a.name}
                      {idx === 0 && (
                        <span className="ml-2 align-middle font-mono text-[9px] uppercase tracking-wider text-copper">
                          ◆ top
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[10px] text-ink-faint">{a.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="display text-[22px] leading-none tracking-tight">
                    {a.salesCount}
                  </p>
                  <p className="eyebrow mt-1">prodejů</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] md:grid-cols-4">
                <Field label="Objem" value={czCurrency(a.salesVolume)} />
                <Field label="Provize" value={czCurrency(a.commission)} />
                <Field label="Ø cena prodeje" value={a.salesCount ? czCurrency(a.avgSalePrice) : "—"} />
                <Field label="Aktivní inzeráty" value={`${a.activeListings} / ${a.totalListings}`} />
              </dl>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-paper-deep">
                  <div
                    className="h-full bg-copper"
                    style={{ width: `${(a.salesVolume / topVolume) * 100}%` }}
                  />
                </div>
                {a.missingRenovation > 0 && (
                  <Badge tone="warn">
                    {a.missingRenovation} bez dat
                  </Badge>
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
      <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="font-mono text-[12px] tabular-nums text-ink md:mt-0.5">{value}</dd>
    </div>
  );
}

"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Filter } from "lucide-react";
import type { PropertyQueryResult as PQR } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

function statusTone(s: string) {
  if (s === "nabízí se") return "warn" as const;
  if (s === "rezervováno") return "info" as const;
  if (s === "prodáno") return "success" as const;
  return "default" as const;
}

export function PropertyQueryResultCard({ data }: { data: PQR }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Filter className="size-4 text-zinc-700" />
        <CardTitle>Výsledek dotazu nad nemovitostmi</CardTitle>
        <Badge tone="info" className="ml-auto">
          {data.matched} z {data.total}
        </Badge>
      </CardHeader>
      <CardBody className="space-y-4">
        {data.matched === 0 ? (
          <p className="text-sm text-zinc-600">Žádná nemovitost neodpovídá zadaným filtrům.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Shod" value={String(data.matched)} sub={`${((data.matched / data.total) * 100).toFixed(0)} % z DB`} />
              <Stat label="Průměrná cena" value={czCurrency(data.avgPrice)} />
              <Stat
                label="Rozdělení stavu"
                value={data.byStatus.map((s) => `${s.status} (${s.count})`).join(" · ")}
              />
            </div>

            <div className="max-h-[420px] overflow-auto rounded-lg border border-zinc-200">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Kód</th>
                    <th className="px-3 py-2 text-left">Adresa</th>
                    <th className="px-3 py-2 text-left">Typ</th>
                    <th className="px-3 py-2 text-right">Cena</th>
                    <th className="px-3 py-2 text-right">m²</th>
                    <th className="px-3 py-2 text-left">Stav</th>
                    <th className="px-3 py-2 text-left">Makléř</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.ref_code} className="border-t border-zinc-100">
                      <td className="px-3 py-2 font-mono text-xs">{r.ref_code}</td>
                      <td className="px-3 py-2">{r.address}</td>
                      <td className="px-3 py-2 text-zinc-600">{r.type}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{czCurrency(r.price_czk)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.area_m2}</td>
                      <td className="px-3 py-2"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                      <td className="px-3 py-2 text-zinc-600">{r.agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.matched > data.rows.length && (
              <p className="text-xs text-zinc-500">
                Zobrazeno prvních {data.rows.length} z {data.matched}. Pro užší výběr zpřesněte filtry.
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

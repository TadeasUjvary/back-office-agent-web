"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users } from "lucide-react";
import type { AgentsResult } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

export function AgentsList({ data }: { data: AgentsResult }) {
  const sorted = [...data.agents].sort((a, b) => b.salesCount - a.salesCount);
  const topVolume = Math.max(...sorted.map((a) => a.salesVolume), 1);
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Users className="size-4 text-indigo-600" />
        <CardTitle>Makléři Reality Holding</CardTitle>
        <Badge tone="info" className="ml-auto">{sorted.length} makléřů</Badge>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {sorted.map((a, idx) => (
            <div key={a.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-zinc-900">
                  {idx === 0 && <span className="mr-1">🏆</span>}
                  {a.name}
                </p>
                <p className="text-xs text-zinc-500">{a.email}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                <Stat label="Prodejů" value={String(a.salesCount)} />
                <Stat label="Objem" value={czCurrency(a.salesVolume)} />
                <Stat label="Provize" value={czCurrency(a.commission)} />
                <Stat label="Ø cena prodeje" value={a.salesCount ? czCurrency(a.avgSalePrice) : "—"} />
                <Stat label="Aktivní nabídky" value={String(a.activeListings)} sub={`z ${a.totalListings} celkem`} />
                <Stat
                  label="Chybí data"
                  value={String(a.missingRenovation)}
                  sub={a.missingRenovation > 0 ? "k urgenci" : "v pořádku"}
                />
              </div>
              {/* Volume bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${(a.salesVolume / topVolume) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
}

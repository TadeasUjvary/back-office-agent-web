"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { getLeadFunnel } from "@/lib/queries";
import { Funnel } from "lucide-react";

type Data = ReturnType<typeof getLeadFunnel>;

const COLORS = ["#94a3b8", "#0ea5e9", "#6366f1", "#10b981", "#ef4444"];

export function LeadFunnelChart({ data }: { data: Data }) {
  const max = Math.max(...data.stages.map((s) => s.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Funnel className="size-4 text-indigo-600" />
          Konverzní trychtýř leadů
        </CardTitle>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge tone="info">Celkem: {data.total}</Badge>
          <Badge tone="success">Konverze: {data.conversionRate} %</Badge>
          <Badge tone="warn">Kvalifikace: {data.qualificationRate} %</Badge>
          {data.district && <Badge>{data.district}</Badge>}
          {data.monthsBack && <Badge>{data.monthsBack} měs. zpět</Badge>}
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {data.stages.map((s, i) => (
          <div key={s.status}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-zinc-900 capitalize">{s.status}</span>
              <span className="tabular-nums text-zinc-700">
                {s.count} <span className="text-zinc-500">({s.pct} %)</span>
              </span>
            </div>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.count / max) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

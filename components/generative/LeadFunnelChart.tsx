"use client";
import { useRef } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { getLeadFunnel } from "@/lib/queries";
import { CHART_COLORS } from "@/lib/chart-colors";
import { ChartExportButton } from "@/components/ChartExportButton";

type Data = ReturnType<typeof getLeadFunnel>;

export function LeadFunnelChart({ data }: { data: Data }) {
  const max = Math.max(...data.stages.map((s) => s.count), 1);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Card ref={ref}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">
              Konverzní trychtýř
              {data.district ? ` · ${data.district}` : ""}
              {data.monthsBack ? ` · ${data.monthsBack} měs.` : ""}
            </p>
            <CardTitle className="mt-1">Pipeline leadů</CardTitle>
          </div>
          <ChartExportButton targetRef={ref} title="Pipeline leadů" />
        </div>
        <div className="mt-4 flex items-baseline gap-8 border-t border-hairline pt-4">
          <KPI label="Celkem" value={String(data.total)} />
          <KPI label="Konverze" value={`${data.conversionRate} %`} accent />
          <KPI label="Kvalifikace" value={`${data.qualificationRate} %`} />
        </div>
      </CardHeader>
      <CardBody>
        <ol className="space-y-4">
          {data.stages.map((s, i) => (
            <li key={s.status}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <span className="text-ink-faint">{String(i + 1).padStart(2, "0")} ·</span> {s.status}
                </span>
                <span className="font-mono text-[12px] tabular-nums text-ink">
                  {s.count} <span className="text-ink-faint">({s.pct} %)</span>
                </span>
              </div>
              <div className="mt-1 h-[6px] w-full bg-paper-deep">
                <div
                  className="h-full"
                  style={{
                    width: `${(s.count / max) * 100}%`,
                    background: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p
        className={`display mt-1 text-[24px] leading-none tracking-tight ${
          accent ? "text-copper" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

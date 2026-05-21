"use client";
import { useRef } from "react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import { ChartExportButton } from "@/components/ChartExportButton";
import type { TrendResult } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

export function TrendChart({ data }: { data: TrendResult }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Card ref={ref}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">
              Posledních {data.monthsBack} měsíců{data.district ? ` · ${data.district}` : ""}
            </p>
            <CardTitle className="mt-1">Leady &amp; prodeje</CardTitle>
          </div>
          <ChartExportButton targetRef={ref} title={`Leady a prodeje — ${data.monthsBack}M`} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 md:grid-cols-5">
          <Kpi label="Leadů" value={String(data.totalLeads)} />
          <Kpi label="Prodejů" value={String(data.totalSales)} />
          <Kpi label="Objem" value={czCurrency(data.totalVolume)} small />
          <Kpi label="Provize" value={czCurrency(data.totalCommission)} small />
          <Kpi label="Ø cena" value={czCurrency(data.avgPricePerSale)} small />
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ left: -10, right: 16, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#A1A1AA" }} />
              <Line
                type="monotone"
                dataKey="leads"
                name="Leady"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[0] }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                name="Prodeje"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[2] }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

function Kpi({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-1 font-semibold leading-tight tracking-[-0.02em] text-text ${
          small ? "text-[14px]" : "text-[22px]"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 font-mono text-[10px] text-text-faint">{sub}</p>}
    </div>
  );
}

"use client";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import type { TrendResult } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

export function TrendChart({ data }: { data: TrendResult }) {
  return (
    <Card>
      <CardHeader>
        <p className="eyebrow">
          Vývoj · posledních {data.monthsBack} měsíců{data.district ? ` · ${data.district}` : ""}
        </p>
        <CardTitle className="mt-1">Leady &amp; prodeje</CardTitle>
        <div className="mt-5 grid grid-cols-2 gap-6 border-t border-hairline pt-4 md:grid-cols-5">
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
              <Tooltip
                contentStyle={{
                  background: "#FBF8F1",
                  border: "1px solid #C9BFAA",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              />
              <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
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
                stroke={CHART_COLORS[3]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[3] }}
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
        className={`display mt-1 ${
          small ? "text-[16px]" : "text-[24px]"
        } leading-tight tracking-tight text-ink`}
      >
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-ink-faint">{sub}</p>}
    </div>
  );
}

"use client";
import {
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import type { NewClientsResult } from "@/lib/queries";

export function ClientsBySourceChart({
  data,
  chartType,
}: {
  data: NewClientsResult;
  chartType: "pie" | "bar";
}) {
  if (data.total === 0) {
    return (
      <Card>
        <CardBody className="text-sm text-ink-muted">
          Za {data.quarter} {data.year} nebyli evidováni žádní noví klienti.
        </CardBody>
      </Card>
    );
  }
  const top = data.bySource[0];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Akvizice klientů — {data.quarter} {data.year}</p>
            <CardTitle className="mt-1">Noví klienti dle zdroje</CardTitle>
          </div>
          <Badge>{chartType}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-6 border-t border-hairline pt-4">
          <Kpi label="Celkem klientů" value={String(data.total)} />
          <Kpi label="Top zdroj" value={top.name} sub={`${top.pct} %`} />
          <Kpi
            label="Prodávající / kupující"
            value={data.byType.map((t) => t.count).join(" / ")}
          />
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={data.bySource}
                  dataKey="count"
                  nameKey="name"
                  outerRadius={100}
                  label={(e: { name?: string; count?: number }) =>
                    `${e.name} · ${e.count}`
                  }
                  labelLine={false}
                  stroke="#FBF8F1"
                  strokeWidth={2}
                >
                  {data.bySource.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, _n, p) => {
                    const pct = (p as { payload?: { pct?: number } })?.payload?.pct;
                    const name = (p as { payload?: { name?: string } })?.payload?.name;
                    return [`${v} klientů (${pct}%)`, name];
                  }}
                />
              </PieChart>
            ) : (
              <BarChart data={data.bySource} margin={{ left: -10, right: 20, top: 8, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" tick={{ fontSize: 10 }} height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Klienti">
                  {data.bySource.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="display mt-1 text-[24px] leading-tight tracking-tight text-ink">
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-ink-faint">{sub}</p>}
    </div>
  );
}

const tooltipStyle = {
  background: "#FBF8F1",
  border: "1px solid #C9BFAA",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "#1A1714",
};

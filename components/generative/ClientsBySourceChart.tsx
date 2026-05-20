"use client";
import {
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { NewClientsResult } from "@/lib/queries";

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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
        <CardBody className="text-sm text-zinc-600">
          Za {data.quarter} {data.year} nebyli evidováni žádní noví klienti.
        </CardBody>
      </Card>
    );
  }
  const top = data.bySource[0];
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Noví klienti dle zdroje — {data.quarter} {data.year}</CardTitle>
          <p className="mt-1 text-xs text-zinc-500">
            Celkem <b>{data.total}</b> · top zdroj <b>{top.name}</b> ({top.pct} %)
            {data.byType.length > 0 && (
              <> · {data.byType.map((t) => `${t.name} ${t.count}`).join(" / ")}</>
            )}
          </p>
        </div>
        <Badge tone="info">{chartType === "pie" ? "Pie" : "Bar"}</Badge>
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
                  label={(entry: { name?: string; count?: number }) =>
                    `${entry.name} (${entry.count})`
                  }
                  labelLine={false}
                >
                  {data.bySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, p) => {
                    const pct = (p as { payload?: { pct?: number } })?.payload?.pct;
                    const name = (p as { payload?: { name?: string } })?.payload?.name;
                    return [`${v} klientů (${pct}%)`, name];
                  }}
                />
              </PieChart>
            ) : (
              <BarChart data={data.bySource} margin={{ left: -10, right: 20, top: 8, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 11 }} height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Klienti">
                  {data.bySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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

"use client";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import { czCurrency } from "@/lib/format";

type Point = { label: string; value: number };
type Series = { name: string; data: Point[] };

type Data = {
  chartType: "pie" | "bar" | "line";
  title: string;
  subtitle?: string;
  data: Point[];
  series?: Series[];
  valueFormat: "number" | "currency" | "percent";
};

function fmt(v: number, kind: Data["valueFormat"]) {
  if (kind === "currency") return czCurrency(v);
  if (kind === "percent") return `${v.toLocaleString("cs-CZ")} %`;
  return v.toLocaleString("cs-CZ");
}

export function RenderChart({ data }: { data: Data }) {
  const valueFormat = data.valueFormat ?? "number";
  const multi = data.series && data.series.length > 0;

  // For bar/line with multiple series, transpose to row-per-label
  const multiRows = multi
    ? (() => {
        const labels = Array.from(
          new Set(data.series!.flatMap((s) => s.data.map((d) => d.label))),
        );
        return labels.map((label) => {
          const row: Record<string, string | number> = { label };
          for (const s of data.series!) {
            const found = s.data.find((d) => d.label === label);
            row[s.name] = found?.value ?? 0;
          }
          return row;
        });
      })()
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            {data.subtitle && <p className="eyebrow">{data.subtitle}</p>}
            <CardTitle className={data.subtitle ? "mt-1" : ""}>{data.title}</CardTitle>
          </div>
          <Badge tone="info">{data.chartType}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {data.chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={data.data}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={110}
                  label={(e: { label?: string; value?: number }) =>
                    `${e.label} · ${e.value != null ? fmt(e.value, valueFormat) : ""}`
                  }
                  labelLine={false}
                  stroke="#131418"
                  strokeWidth={2}
                >
                  {data.data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, p) => {
                    const label = (p as { payload?: { label?: string } })?.payload?.label;
                    return [fmt(Number(v), valueFormat), label];
                  }}
                />
              </PieChart>
            ) : data.chartType === "bar" ? (
              <BarChart
                data={multi ? multiRows : data.data}
                margin={{ left: -5, right: 16, top: 8, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                  height={60}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(Number(v), valueFormat)} />
                <Tooltip formatter={(v) => fmt(Number(v), valueFormat)} />
                {multi ? (
                  <>
                    <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                    {data.series!.map((s, i) => (
                      <Bar
                        key={s.name}
                        dataKey={s.name}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </>
                ) : (
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {data.data.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            ) : (
              <LineChart
                data={multi ? multiRows : data.data}
                margin={{ left: -5, right: 16, top: 8, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(Number(v), valueFormat)} />
                <Tooltip formatter={(v) => fmt(Number(v), valueFormat)} />
                {multi ? (
                  <>
                    <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                    {data.series!.map((s, i) => (
                      <Line
                        key={s.name}
                        type="monotone"
                        dataKey={s.name}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </>
                ) : (
                  <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

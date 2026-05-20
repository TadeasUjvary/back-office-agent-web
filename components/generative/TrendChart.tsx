"use client";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { TrendResult } from "@/lib/queries";

export function TrendChart({ data }: { data: TrendResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Vývoj leadů a prodejů — posledních {data.monthsBack} měsíců
          {data.district ? ` · ${data.district}` : ""}
        </CardTitle>
        <div className="mt-2 flex gap-3 text-xs text-zinc-600">
          <Badge tone="info">Leadů celkem: {data.totalLeads}</Badge>
          <Badge tone="success">Prodejů celkem: {data.totalSales}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ left: -10, right: 16, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="leads"
                name="Leady"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                name="Prodeje"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

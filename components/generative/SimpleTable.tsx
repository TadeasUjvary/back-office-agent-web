"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Column<T> = {
  key: keyof T | string;
  label: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
};

export function SimpleTable<T extends Record<string, unknown>>({
  title,
  subtitle,
  columns,
  rows,
  topBadges,
}: {
  title: string;
  subtitle?: React.ReactNode;
  columns: Column<T>[];
  rows: T[];
  topBadges?: { label: string; tone?: "info" | "success" | "warn" | "danger" | "default" }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
        {topBadges && topBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topBadges.map((b, i) => (
              <Badge key={i} tone={b.tone ?? "default"}>{b.label}</Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-600">Žádné shody.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-lg border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={String(c.key)}
                      className={`px-3 py-2 ${c.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-zinc-100">
                    {columns.map((c) => (
                      <td
                        key={String(c.key)}
                        className={`px-3 py-2 ${c.align === "right" ? "text-right tabular-nums" : ""}`}
                      >
                        {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key as string] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

"use client";
import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertCircle, MailCheck } from "lucide-react";
import type { AuditResult } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

function statusTone(s: string) {
  if (s === "nabízí se") return "warn" as const;
  if (s === "rezervováno") return "info" as const;
  return "default" as const;
}

export function AuditTable({ data }: { data: AuditResult }) {
  const [urged, setUrged] = useState<string[]>([]);
  const toggle = (agent: string) =>
    setUrged((u) => (u.includes(agent) ? u : [...u, agent]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="size-4 text-amber-600" />
          Nemovitosti s chybějícími daty o rekonstrukci
        </CardTitle>
        <p className="mt-1 text-xs text-zinc-500">
          Nalezeno <b>{data.rows.length}</b> z {data.totalProperties} nemovitostí
          {data.district ? ` v lokalitě ${data.district}` : ""}.{" "}
          <b>{data.listedCount}</b> z nich je aktivně nabízeno — doplnit prioritně.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* By agent summary */}
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Rozdělení dle makléřů — pošli urgenci
          </p>
          <div className="flex flex-wrap gap-2">
            {data.byAgent.map((b) => {
              const isUrged = urged.includes(b.agent);
              return (
                <Button
                  key={b.agent}
                  variant={isUrged ? "primary" : "secondary"}
                  onClick={() => toggle(b.agent)}
                  disabled={isUrged}
                  className="text-xs"
                >
                  {isUrged ? <MailCheck className="size-3" /> : null}
                  {b.agent} <span className="ml-1 opacity-70">({b.count})</span>
                  {isUrged && <span className="ml-1">Urgováno</span>}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[460px] overflow-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">Kód</th>
                <th className="px-3 py-2 text-left">Adresa</th>
                <th className="px-3 py-2 text-left">Typ</th>
                <th className="px-3 py-2 text-right">Cena</th>
                <th className="px-3 py-2 text-left">Stav</th>
                <th className="px-3 py-2 text-left">Makléř</th>
                <th className="px-3 py-2 text-left">Chybí</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.ref_code} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-mono text-xs">{r.ref_code}</td>
                  <td className="px-3 py-2">{r.address}</td>
                  <td className="px-3 py-2 text-zinc-600">{r.type}</td>
                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{czCurrency(r.price_czk)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{r.agent}</td>
                  <td className="px-3 py-2">
                    {r.missing.map((m) => (
                      <Badge key={m} tone="danger" className="mr-1">{m}</Badge>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

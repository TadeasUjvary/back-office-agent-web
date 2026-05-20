"use client";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BellRing, ArrowRight } from "lucide-react";
import { czShortDate } from "@/lib/format";
import type { MonitoringConfirmation } from "@/lib/queries";

export function BriefingCard({ data }: { data: MonitoringConfirmation }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <BellRing className="size-4 text-amber-600" />
        <CardTitle>Ranní briefing nastaven</CardTitle>
        <Badge tone="success" className="ml-auto">Aktivní</Badge>
      </CardHeader>
      <CardBody className="space-y-4 text-sm">
        <p className="text-zinc-700">
          Každé ráno v <b>{data.time}</b> dostanete přehled nových nabídek v lokalitě{" "}
          <b>{data.district}</b> z portálů: {data.portals.join(", ")}.
          Příští spuštění: <b>{data.nextRun}</b>.
        </p>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Posledních {data.recentBriefings.length} ranních přehledů
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.recentBriefings.map((b) => (
              <Link
                key={b.date}
                href={`/briefings?date=${b.date}&district=${encodeURIComponent(data.district)}`}
                className="rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="text-xs text-zinc-500">{czShortDate(b.date)}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                  {b.newCount}
                </p>
                <p className="text-xs text-zinc-500">nových nabídek</p>
              </Link>
            ))}
          </div>
        </div>
        <Link
          href={`/briefings?district=${encodeURIComponent(data.district)}`}
          className="inline-block"
        >
          <Button variant="secondary">
            Otevřít všechny ranní briefingy <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}

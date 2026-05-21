"use client";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { useCalendarStore } from "@/lib/calendar-store";
import { czDate } from "@/lib/format";

type Data = {
  mode: "client-read";
  filters: { from?: string; to?: string; query?: string };
};

const TODAY_ISO = "2026-05-17";

export function CalendarRead({ data }: { data: Data }) {
  const allEvents = useCalendarStore((s) => s.events);
  const { from, to, query } = data.filters;

  const filtered = allEvents
    .filter((e) => {
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (!from && !to && e.date < TODAY_ISO) return false; // default: nadcházející
      if (query && !e.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 30);

  const rangeLabel =
    from && to
      ? `${from} → ${to}`
      : from
        ? `od ${from}`
        : to
          ? `do ${to}`
          : "nadcházející";

  // Group by date
  const byDate = new Map<string, typeof filtered>();
  for (const e of filtered) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  const dates = Array.from(byDate.keys());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-cyan/15 text-cyan">
            <Calendar className="size-4" />
          </div>
          <div className="flex-1">
            <p className="eyebrow">Pepův kalendář · {rangeLabel}</p>
            <CardTitle className="mt-1">
              {filtered.length === 0 ? "Žádné události" : `${filtered.length} ${filtered.length === 1 ? "událost" : filtered.length < 5 ? "události" : "událostí"}`}
              {query && <span className="text-text-faint"> · „{query}"</span>}
            </CardTitle>
          </div>
          {filtered.length > 0 && (
            <Link href="/calendar">
              <Badge tone="info">
                Otevřít kalendář
              </Badge>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {filtered.length === 0 ? (
          <p className="px-5 py-4 text-sm text-text-muted">
            V daném rozsahu nic není. Zkuste jiné datum, nebo přidejte událost ({" "}
            <Link href="/calendar" className="text-accent-bright hover:underline">/calendar</Link>).
          </p>
        ) : (
          <ul>
            {dates.map((date) => {
              const events = byDate.get(date)!;
              return (
                <li key={date} className="border-b border-border last:border-b-0">
                  <div className="bg-surface-2/40 px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-text-faint">
                    {czDate(date)}
                  </div>
                  {events.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="font-mono text-[11px] tabular-nums text-accent-bright w-12 shrink-0 pt-0.5">
                        {e.startTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-[13px] font-medium text-text truncate">{e.title}</p>
                          {e.source === "agent" && (
                            <Badge tone="info" className="shrink-0">agent</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-text-faint">
                          {e.durationMinutes && (
                            <span className="font-mono">{e.durationMinutes} min</span>
                          )}
                          {e.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-2.5" />
                              {e.location}
                            </span>
                          )}
                          {e.attendees && e.attendees.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-2.5" />
                              {e.attendees.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        )}
        {filtered.length > 0 && (
          <div className="border-t border-border px-5 py-3">
            <Link
              href={`/calendar${data.filters.from ? `?date=${data.filters.from}` : ""}`}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-text-faint hover:text-accent-bright"
            >
              Otevřít kalendář <ExternalLink className="size-2.5" />
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

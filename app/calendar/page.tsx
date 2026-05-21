"use client";
import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { Sparkles, Trash2, Users, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarStore, type CalendarEvent } from "@/lib/calendar-store";
import { useAuth } from "@/lib/auth";
import { czDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const TODAY_ISO = "2026-05-17";

function startOfWeek(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dow = t.getUTCDay() || 7; // Mon=1..Sun=7
  t.setUTCDate(t.getUTCDate() - (dow - 1));
  return iso10(t);
}
function iso10(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + n);
  return iso10(t);
}

const CZ_DOW_SHORT = ["po", "út", "st", "čt", "pá", "so", "ne"];
function dowShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  // remap: getUTCDay 0=Sun,1=Mon → our array starts Mon
  const idx = day === 0 ? 6 : day - 1;
  return CZ_DOW_SHORT[idx];
}

export default function CalendarPage() {
  const { user } = useAuth();
  const events = useCalendarStore((s) => s.events);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const removeEvent = (id: string) => {
    if (!user) return;
    deleteEvent(user, id).catch((e) => console.warn("[calendar] delete failed", e));
  };

  const [weekStart, setWeekStart] = useState(() => startOfWeek(TODAY_ISO));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [events]);

  const agentCount = events.filter((e) => e.source === "agent").length;
  const totalCount = events.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow="Pepův kalendář · Europe/Prague"
        title="Co máte v plánu"
        description={
          <>
            Stávajících schůzek: <span className="font-mono">{totalCount - agentCount}</span>.
            Co naplánoval asistent v chatu: <span className="font-mono text-accent-bright">{agentCount}</span>.
            Cokoliv přibude v rozhovoru, objeví se tady.
          </>
        }
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-2">
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button variant="secondary" onClick={() => setWeekStart(startOfWeek(TODAY_ISO))} className="text-xs">
              Tento týden
            </Button>
            <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-2">
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isToday = day === TODAY_ISO;
            const list = byDate.get(day) ?? [];
            return (
              <div
                key={day}
                className={cn(
                  "rounded-lg border bg-surface/60 lift",
                  isToday ? "border-accent/40" : "border-border",
                )}
              >
                <div className={cn(
                  "border-b border-border px-3 py-2",
                  isToday && "bg-accent/10",
                )}>
                  <p className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-text-faint">
                      {dowShort(day)}
                    </span>
                    <span className={cn(
                      "font-mono text-[12px] tabular-nums",
                      isToday ? "text-accent-bright" : "text-text-2",
                    )}>
                      {day.slice(-2)}.
                    </span>
                  </p>
                </div>
                <div className="min-h-[140px] space-y-1 p-2">
                  {list.length === 0 ? (
                    <p className="px-1 py-2 text-[10px] text-text-dim">prázdný den</p>
                  ) : (
                    list.map((e) => (
                      <EventChip key={e.id} event={e} onRemove={removeEvent} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recently added by agent */}
        {agentCount > 0 && (
          <Card>
            <CardHeader>
              <p className="eyebrow">Naplánováno agentem</p>
              <CardTitle className="mt-1">{agentCount} {agentCount === 1 ? "událost" : "události"}</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <ul>
                {events
                  .filter((e) => e.source === "agent")
                  .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
                  .map((e) => (
                    <li key={e.id} className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-b-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-bright">
                        <Sparkles className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-text">{e.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-text-faint">
                          {czDate(e.date)} · {e.startTime}
                          {e.durationMinutes ? ` (${e.durationMinutes} min)` : ""}
                          {e.location ? ` · ${e.location}` : ""}
                        </p>
                        {e.attendees && e.attendees.length > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-text-muted">
                            <Users className="size-3" />
                            {e.attendees.join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeEvent(e.id)}
                        title="Smazat"
                        className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-rose"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function EventChip({
  event,
  onRemove,
}: {
  event: CalendarEvent;
  onRemove: (id: string) => void;
}) {
  const isAgent = event.source === "agent";
  return (
    <div
      className={cn(
        "group rounded-md border px-2 py-1.5 text-[11px] leading-snug transition-colors",
        isAgent
          ? "border-accent/40 bg-accent/10 text-text"
          : "border-border bg-surface text-text-2",
      )}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className={cn("font-mono text-[10px] tabular-nums", isAgent ? "text-accent-bright" : "text-text-faint")}>
          {event.startTime}
        </span>
        {isAgent && (
          <button
            onClick={() => onRemove(event.id)}
            className="opacity-0 transition-opacity group-hover:opacity-100 text-text-faint hover:text-rose"
            title="Smazat"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
      <p className="line-clamp-2 mt-0.5">{event.title}</p>
      {event.location && (
        <p className="mt-0.5 flex items-center gap-1 text-[9px] text-text-faint">
          <MapPin className="size-2.5" />
          {event.location}
        </p>
      )}
    </div>
  );
}

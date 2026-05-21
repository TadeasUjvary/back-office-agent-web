"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarPlus, CheckCircle2, ExternalLink, MapPin, Users } from "lucide-react";
import { useCalendarStore } from "@/lib/calendar-store";
import type { mockAddCalendarEvent } from "@/lib/actions";
import { czDate } from "@/lib/format";

type Data = ReturnType<typeof mockAddCalendarEvent>;

export function EventCreatedCard({ data }: { data: Data }) {
  // Add to Zustand calendar store on mount (idempotent via id)
  useEffect(() => {
    useCalendarStore.getState().addEvent({
      id: data.eventId,
      title: data.title,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      attendees: data.attendees,
      location: data.location !== "—" ? data.location : undefined,
      notes: data.notes,
      source: "agent",
    });
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-bright">
            <CalendarPlus className="size-4" />
          </div>
          <div className="flex-1">
            <p className="eyebrow">Google Calendar · {data.calendar}</p>
            <CardTitle className="mt-1">{data.title}</CardTitle>
          </div>
          <Badge tone="success">
            <CheckCircle2 className="mr-1 size-3" /> Uloženo
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-[13px]">
          <dt className="text-text-faint">Kdy</dt>
          <dd className="text-text">
            <span className="font-medium">{czDate(data.date)}</span>{" "}
            <span className="text-text-muted">·</span>{" "}
            <span className="font-mono">{data.startTime}</span>{" "}
            <span className="text-text-muted">({data.durationMinutes} min)</span>
          </dd>
          {data.attendees.length > 0 && (
            <>
              <dt className="text-text-faint">Účastníci</dt>
              <dd className="text-text-2">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3 text-text-faint" />
                  {data.attendees.join(", ")}
                </span>
              </dd>
            </>
          )}
          {data.location !== "—" && (
            <>
              <dt className="text-text-faint">Místo</dt>
              <dd className="text-text-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 text-text-faint" />
                  {data.location}
                </span>
              </dd>
            </>
          )}
          <dt className="text-text-faint">Event ID</dt>
          <dd className="font-mono text-[11px] text-text-faint">{data.eventId}</dd>
        </dl>

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Link href={`/calendar?date=${data.date}`}>
            <Button variant="secondary">
              Otevřít v kalendáři <ExternalLink className="size-3" />
            </Button>
          </Link>
          <a
            href={data.htmlLink}
            className="font-mono text-[10px] text-text-faint hover:text-text"
            target="_blank"
            rel="noopener noreferrer"
          >
            calendar.google.com ↗
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

import { NextResponse } from "next/server";
import { listEvents, addEvent, seedUserCalendar, type DbCalendarEvent } from "@/lib/db/calendar";

export const runtime = "nodejs";

function getUserId(req: Request): string | null {
  const v = req.headers.get("x-user-id");
  if (!v) return null;
  return decodeURIComponent(v).trim() || null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  try {
    // Seed on first ever GET (idempotent)
    await seedUserCalendar(userId);
    const events = await listEvents(userId, from, to);
    return NextResponse.json({ events: events.map(toUiShape) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  try {
    const body = await req.json();
    const ev = await addEvent(userId, body);
    return NextResponse.json({ event: toUiShape(ev) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "create failed" },
      { status: 500 },
    );
  }
}

function toUiShape(e: DbCalendarEvent) {
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time ?? undefined,
    durationMinutes: e.duration_minutes ?? undefined,
    attendees: e.attendees ?? [],
    location: e.location ?? undefined,
    notes: e.notes ?? undefined,
    source: e.source,
    createdAt: e.created_at,
  };
}

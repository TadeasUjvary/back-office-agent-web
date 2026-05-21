/** Static seed events shipped from data/calendar.json (mock Google Calendar). */
import calendarJson from "@/data/calendar.json";
import type { CalendarEvent } from "./calendar-store";

type RawEvent = { date: string; start: string; end: string; title: string };

export function loadSeedEvents(): CalendarEvent[] {
  const cal = calendarJson as { events: RawEvent[] };
  return cal.events.map((ev, idx) => {
    const [sh, sm] = ev.start.split(":").map(Number);
    const [eh, em] = ev.end.split(":").map(Number);
    const dur = eh * 60 + em - (sh * 60 + sm);
    return {
      id: `seed-${idx + 1}`,
      title: ev.title,
      date: ev.date,
      startTime: ev.start,
      endTime: ev.end,
      durationMinutes: dur,
      source: "seed" as const,
    };
  });
}

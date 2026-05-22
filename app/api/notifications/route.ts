import { NextResponse } from "next/server";
import { getNotifications, type AppNotification } from "@/lib/notifications";
import { listEvents } from "@/lib/db/calendar";
import { TODAY_ISO } from "@/data/db";
import { czShortDate } from "@/lib/format";

export const runtime = "nodejs";

function getUserId(req: Request): string | null {
  const v = req.headers.get("x-user-id");
  if (!v) return null;
  return decodeURIComponent(v).trim() || null;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const base = getNotifications();
  const userId = getUserId(req);

  const calendar: AppNotification[] = [];
  if (userId) {
    try {
      const to = addDays(TODAY_ISO, 3);
      const events = await listEvents(userId, TODAY_ISO, to);
      for (const e of events.slice(0, 4)) {
        const when =
          e.date === TODAY_ISO
            ? `dnes v ${e.start_time.slice(0, 5)}`
            : e.date === addDays(TODAY_ISO, 1)
              ? `zítra v ${e.start_time.slice(0, 5)}`
              : `${czShortDate(e.date)} v ${e.start_time.slice(0, 5)}`;
        calendar.push({
          id: `cal-${e.id}`,
          tone: "calendar",
          title: "Nadcházející schůzka",
          body: `${e.title} — ${when}.`,
          href: "/calendar",
          ts: `${e.date}T${e.start_time}`,
        });
      }
    } catch {
      // calendar unavailable (e.g. Supabase not configured) — non-fatal
    }
  }

  const all = [...calendar, ...base].sort((a, b) => b.ts.localeCompare(a.ts));
  return NextResponse.json({ notifications: all });
}

import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { loadSeedEvents } from "@/lib/calendar-seed";

export type DbCalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  attendees: string[];
  location: string | null;
  notes: string | null;
  source: "seed" | "agent";
  created_at: string;
};

/** Seed the canonical 21 mock Google-Calendar events for a fresh user.
 *  Idempotent: skips if user already has seed events. */
export async function seedUserCalendar(userId: string) {
  const sb = getServerSupabase();
  const { data: existing, error } = await sb
    .from("calendar_events")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "seed")
    .limit(1);
  if (error) throw error;
  if ((existing ?? []).length > 0) return; // already seeded

  const seed = loadSeedEvents();
  const rows = seed.map((e) => ({
    id: `${userId}-${e.id}`,
    user_id: userId,
    title: e.title,
    date: e.date,
    start_time: e.startTime,
    end_time: e.endTime ?? null,
    duration_minutes: e.durationMinutes ?? null,
    attendees: [],
    location: null,
    notes: null,
    source: "seed" as const,
  }));
  const { error: insertErr } = await sb.from("calendar_events").insert(rows);
  if (insertErr) throw insertErr;
}

export async function listEvents(userId: string, from?: string, to?: string) {
  const sb = getServerSupabase();
  let q = sb.from("calendar_events").select("*").eq("user_id", userId);
  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);
  const { data, error } = await q.order("date", { ascending: true }).order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbCalendarEvent[];
}

export async function addEvent(
  userId: string,
  event: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    attendees?: string[];
    location?: string;
    notes?: string;
  },
) {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("calendar_events")
    .upsert(
      {
        id: event.id,
        user_id: userId,
        title: event.title,
        date: event.date,
        start_time: event.startTime,
        end_time: event.endTime ?? null,
        duration_minutes: event.durationMinutes ?? null,
        attendees: event.attendees ?? [],
        location: event.location ?? null,
        notes: event.notes ?? null,
        source: "agent" as const,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as DbCalendarEvent;
}

export async function removeEvent(userId: string, id: string) {
  const sb = getServerSupabase();
  const { error } = await sb
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .neq("source", "seed"); // ochrana — seed nelze smazat
  if (error) throw error;
}

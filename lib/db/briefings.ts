import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { generateBriefingListings } from "@/lib/briefing-seed";

const REF_DATE = "2026-05-17";
const DEFAULT_DISTRICT = "Praha-Holešovice";

export type DbBriefing = {
  id: string;
  user_id: string;
  date: string;
  district: string;
  listings: Array<{
    id: string;
    portal: string;
    title: string;
    district: string;
    type: string;
    area_m2: number;
    price_czk: number;
    url: string;
    published: string;
  }>;
  generated_by: "manual" | "cron" | "seed";
  created_at: string;
};

export type SimState = {
  user_id: string;
  district: string;
  last_sim_date: string;
  updated_at: string;
};

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + n);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** Seed 7 historical days (REF_DATE-6 ... REF_DATE) for a fresh user. */
export async function seedHistoricalBriefings(userId: string, district = DEFAULT_DISTRICT) {
  const sb = getServerSupabase();
  const { data: existing, error } = await sb
    .from("briefings")
    .select("id")
    .eq("user_id", userId)
    .eq("district", district)
    .limit(1);
  if (error) throw error;
  if ((existing ?? []).length > 0) return;

  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(REF_DATE, -i);
    rows.push({
      user_id: userId,
      date,
      district,
      listings: generateBriefingListings(date, district),
      generated_by: "seed" as const,
    });
  }
  const { error: insertErr } = await sb.from("briefings").upsert(rows, {
    onConflict: "user_id,date,district",
  });
  if (insertErr) throw insertErr;

  await sb.from("sim_state").upsert(
    { user_id: userId, district, last_sim_date: REF_DATE },
    { onConflict: "user_id" },
  );
}

export async function listBriefings(userId: string, district = DEFAULT_DISTRICT) {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("briefings")
    .select("*")
    .eq("user_id", userId)
    .eq("district", district)
    .order("date", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as DbBriefing[];
}

export async function getSimState(userId: string): Promise<SimState> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("sim_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as SimState;
  // bootstrap default row
  const { data: created, error: insertErr } = await sb
    .from("sim_state")
    .insert({ user_id: userId })
    .select()
    .single();
  if (insertErr) throw insertErr;
  return created as SimState;
}

/** Advance simulated day by +1, generate listings for new day, insert briefing. */
export async function advanceSimDay(userId: string) {
  const sb = getServerSupabase();
  const sim = await getSimState(userId);
  const nextDate = addDays(sim.last_sim_date, 1);
  const listings = generateBriefingListings(nextDate, sim.district);
  const { data: brief, error } = await sb
    .from("briefings")
    .upsert(
      {
        user_id: userId,
        date: nextDate,
        district: sim.district,
        listings,
        generated_by: "manual" as const,
      },
      { onConflict: "user_id,date,district" },
    )
    .select()
    .single();
  if (error) throw error;
  await sb
    .from("sim_state")
    .update({ last_sim_date: nextDate, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return brief as DbBriefing;
}

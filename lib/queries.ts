import { loadAll, TODAY_ISO } from "@/data/db";
import type { FeedListing } from "@/data/generate";

// ─── Helpers ──────────────────────────────────────────────────────────────
function dateKey(s: string) {
  // first 10 chars of "YYYY-MM-DD HH:MM" or "YYYY-MM-DD"
  return s.slice(0, 10);
}
function inRange(iso: string, from: string, toExcl: string) {
  return iso >= from && iso < toExcl;
}
function quarterRange(quarter: "Q1" | "Q2" | "Q3" | "Q4", year: number) {
  const startMonth = { Q1: 1, Q2: 4, Q3: 7, Q4: 10 }[quarter];
  const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endMonth = startMonth + 3;
  const toY = endMonth > 12 ? year + 1 : year;
  const toM = endMonth > 12 ? endMonth - 12 : endMonth;
  const toExcl = `${toY}-${String(toM).padStart(2, "0")}-01`;
  return { from, toExcl };
}

// ─── 1. New clients by quarter, grouped by source ─────────────────────────
export type NewClientsResult = {
  quarter: string;
  year: number;
  total: number;
  bySource: { name: string; count: number; pct: number }[];
  byType: { name: string; count: number }[];
};

export function getNewClients(
  quarter: "Q1" | "Q2" | "Q3" | "Q4",
  year: number,
): NewClientsResult {
  const { clients, sources } = loadAll();
  const { from, toExcl } = quarterRange(quarter, year);
  const filtered = clients.filter((c) => inRange(c.created_at, from, toExcl));
  const total = filtered.length;
  const srcMap = new Map<number, number>();
  for (const c of filtered) srcMap.set(c.source_id, (srcMap.get(c.source_id) ?? 0) + 1);
  const bySource = sources
    .map((s) => ({
      name: s.name,
      count: srcMap.get(s.id) ?? 0,
      pct: total ? +(((srcMap.get(s.id) ?? 0) / total) * 100).toFixed(1) : 0,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const typeMap = new Map<string, number>();
  for (const c of filtered) typeMap.set(c.type, (typeMap.get(c.type) ?? 0) + 1);
  const byType = [...typeMap.entries()].map(([name, count]) => ({ name, count }));
  return { quarter, year, total, bySource, byType };
}

// ─── 2. Leads + sales trend per month ─────────────────────────────────────
export type TrendPoint = {
  month: string; // "květen 2026"
  isoMonth: string; // "2026-05"
  leads: number;
  sales: number;
};
export type TrendResult = {
  monthsBack: number;
  district?: string;
  series: TrendPoint[];
  totalLeads: number;
  totalSales: number;
};

const CZ_MONTHS = [
  "", "leden", "únor", "březen", "duben", "květen", "červen",
  "červenec", "srpen", "září", "říjen", "listopad", "prosinec",
] as const;

export function getLeadsAndSalesTrend(
  monthsBack: number,
  district?: string,
): TrendResult {
  const { leads, sales, properties } = loadAll();
  const [ty, tm] = TODAY_ISO.split("-").map(Number);
  const series: TrendPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    let y = ty;
    let m = tm - i;
    while (m <= 0) { m += 12; y -= 1; }
    const iso = `${y}-${String(m).padStart(2, "0")}`;
    series.push({ month: `${CZ_MONTHS[m]} ${y}`, isoMonth: iso, leads: 0, sales: 0 });
  }
  const idx = new Map(series.map((p, i) => [p.isoMonth, i]));
  for (const l of leads) {
    if (district && l.region !== district) continue;
    const k = l.created_at.slice(0, 7);
    const i = idx.get(k);
    if (i !== undefined) series[i].leads += 1;
  }
  const propById = new Map(properties.map((p) => [p.id, p]));
  for (const s of sales) {
    if (district) {
      const p = propById.get(s.property_id);
      if (!p || p.district !== district) continue;
    }
    const k = s.closed_at.slice(0, 7);
    const i = idx.get(k);
    if (i !== undefined) series[i].sales += 1;
  }
  return {
    monthsBack,
    district,
    series,
    totalLeads: series.reduce((a, p) => a + p.leads, 0),
    totalSales: series.reduce((a, p) => a + p.sales, 0),
  };
}

// ─── 3. Free calendar slots + email draft data ────────────────────────────
export type FreeSlot = { date: string; weekday: string; label: string; times: string[] };
export type ViewingSlotsResult = {
  property?: {
    ref_code: string;
    address: string;
    district: string;
    price_czk: number;
    type: string;
  };
  durationMin: number;
  suggestions: { date: string; label: string; time: string }[];
  byDay: FreeSlot[];
  emailDraft: { subject: string; body: string; to: string };
};

const CZ_DOW = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
function hhmm(s: string) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }
function fmtHM(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

export function proposeViewingSlots(
  propertyRef: string | undefined,
  daysAhead: number,
  slotMinutes: number,
): ViewingSlotsResult {
  const { calendar, properties } = loadAll();
  const property = propertyRef
    ? properties.find((p) => p.ref_code === propertyRef)
    : undefined;
  const propertyOut = property
    ? {
        ref_code: property.ref_code,
        address: property.address,
        district: property.district,
        price_czk: property.price_czk,
        type: property.type,
      }
    : undefined;

  const wh = calendar.working_hours;
  const wStart = hhmm(wh.start);
  const wEnd = hhmm(wh.end);
  const workdays = new Set(wh.workdays);
  const byDay = new Map<string, { s: number; e: number }[]>();
  for (const ev of calendar.events) {
    const arr = byDay.get(ev.date) ?? [];
    arr.push({ s: hhmm(ev.start), e: hhmm(ev.end) });
    byDay.set(ev.date, arr);
  }

  const result: FreeSlot[] = [];
  const [sy, sm, sd] = calendar.generated_for.split("-").map(Number);
  let cur = new Date(Date.UTC(sy, sm - 1, sd));
  let checked = 0;
  while (checked < daysAhead) {
    const dow = cur.getUTCDay();
    if (workdays.has(dow)) {
      checked += 1;
      const dStr = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}-${String(cur.getUTCDate()).padStart(2, "0")}`;
      const busy = (byDay.get(dStr) ?? []).slice().sort((a, b) => a.s - b.s);
      const free: { s: number; e: number }[] = [];
      let cursor = wStart;
      for (const b of busy) {
        if (b.s > cursor) free.push({ s: cursor, e: b.s });
        cursor = Math.max(cursor, b.e);
      }
      if (cursor < wEnd) free.push({ s: cursor, e: wEnd });
      const times: string[] = [];
      for (const f of free) {
        let t = f.s;
        while (t + slotMinutes <= f.e) {
          times.push(fmtHM(t));
          t += slotMinutes;
        }
      }
      if (times.length) {
        const [yy, mm, dd] = dStr.split("-").map(Number);
        const label = `${CZ_DOW[dow]} ${dd}. ${CZ_MONTHS[mm]}`;
        result.push({ date: dStr, weekday: CZ_DOW[dow], label, times });
      }
    }
    cur = new Date(cur.getTime() + 86_400_000);
  }

  const suggestions = result.slice(0, 3).map((r) => ({
    date: r.date, label: r.label, time: r.times[0],
  }));

  const propertyDesc = property
    ? `${property.type}, ${property.address} (${property.ref_code})`
    : "Vámi vybraná nemovitost";

  const slotsText = suggestions.length
    ? suggestions.map((s) => `  • ${s.label} v ${s.time}`).join("\n")
    : "  • (žádné volné termíny v daném horizontu)";

  const body =
`Dobrý den,

děkujeme za Váš zájem o ${propertyDesc}. Velmi rád bych s Vámi domluvil osobní prohlídku.

Nabízím Vám následující termíny:

${slotsText}

Dejte mi prosím vědět, který termín Vám nejvíce vyhovuje, případně navrhněte alternativu — rád se přizpůsobím.

S pozdravem,
Pepa
Reality Holding`;

  return {
    property: propertyOut,
    durationMin: slotMinutes,
    suggestions,
    byDay: result,
    emailDraft: {
      to: "zajemce@email.cz",
      subject: property
        ? `Prohlídka — ${property.type} ${property.address} (${property.ref_code})`
        : "Návrh termínu prohlídky",
      body,
    },
  };
}

// ─── 4. Audit missing renovation data ─────────────────────────────────────
export type AuditRow = {
  ref_code: string; address: string; district: string; type: string;
  price_czk: number; status: string; agent: string;
  missing: string[];
};
export type AuditResult = {
  district?: string;
  totalProperties: number;
  rows: AuditRow[];
  byAgent: { agent: string; count: number }[];
  listedCount: number;
};

export function auditMissingRenovationData(
  district?: string,
  minPrice?: number,
): AuditResult {
  const { properties, agents } = loadAll();
  const agentById = new Map(agents.map((a) => [a.id, a.name]));
  const statusOrder: Record<string, number> = { "nabízí se": 0, "rezervováno": 1, "prodáno": 2 };
  const filtered = properties
    .filter((p) => p.has_renovation_data === 0)
    .filter((p) => !district || p.district === district)
    .filter((p) => minPrice === undefined || p.price_czk >= minPrice)
    .sort((a, b) => (statusOrder[a.status] - statusOrder[b.status]) || b.price_czk - a.price_czk);

  const rows: AuditRow[] = filtered.map((p) => {
    const missing: string[] = [];
    if (!p.renovation_year) missing.push("rok rekonstrukce");
    if (!p.construction_modifications) missing.push("stavební úpravy");
    return {
      ref_code: p.ref_code,
      address: p.address,
      district: p.district,
      type: p.type,
      price_czk: p.price_czk,
      status: p.status,
      agent: agentById.get(p.agent_id) ?? "—",
      missing,
    };
  });

  const agentMap = new Map<string, number>();
  for (const r of rows) agentMap.set(r.agent, (agentMap.get(r.agent) ?? 0) + 1);
  const byAgent = [...agentMap.entries()]
    .map(([agent, count]) => ({ agent, count }))
    .sort((a, b) => b.count - a.count);
  const listedCount = rows.filter((r) => r.status === "nabízí se").length;

  return {
    district,
    totalProperties: properties.length,
    rows,
    byAgent,
    listedCount,
  };
}

// ─── 5. Weekly report KPIs ────────────────────────────────────────────────
export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  newLeads: number;
  newClients: number;
  nSales: number;
  volume: number;
  commission: number;
  topAgent: { name: string; count: number };
  leadsBySource: { name: string; count: number }[];
  pipeline: { status: string; count: number }[];
  active: number;
  reserved: number;
  missing: number;
};

function addISODays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const t2 = new Date(t.getTime() + days * 86_400_000);
  return `${t2.getUTCFullYear()}-${String(t2.getUTCMonth() + 1).padStart(2, "0")}-${String(t2.getUTCDate()).padStart(2, "0")}`;
}

export function weeklyReport(weekEnding?: string): WeeklyReport {
  const { leads, sales, clients, properties, sources, agents } = loadAll();
  const end = weekEnding ?? addISODays(TODAY_ISO, -1); // up to yesterday
  const start = addISODays(end, -6);
  const fromIso = start;
  const toExcl = addISODays(end, 1);

  const newLeads = leads.filter((l) => inRange(l.created_at, fromIso, toExcl)).length;
  const leadsSrcMap = new Map<number, number>();
  for (const l of leads) {
    if (inRange(l.created_at, fromIso, toExcl)) {
      leadsSrcMap.set(l.source_id, (leadsSrcMap.get(l.source_id) ?? 0) + 1);
    }
  }
  const leadsBySource = sources
    .map((s) => ({ name: s.name, count: leadsSrcMap.get(s.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const weekSales = sales.filter((s) => inRange(s.closed_at, fromIso, toExcl));
  const nSales = weekSales.length;
  const volume = weekSales.reduce((a, s) => a + s.sale_price_czk, 0);
  const commission = weekSales.reduce((a, s) => a + s.commission_czk, 0);

  const newClients = clients.filter((c) => inRange(c.created_at, fromIso, toExcl)).length;

  const agentCount = new Map<number, number>();
  for (const s of weekSales) agentCount.set(s.agent_id, (agentCount.get(s.agent_id) ?? 0) + 1);
  const topAgentEntry = [...agentCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const agentById = new Map(agents.map((a) => [a.id, a.name]));
  const topAgent = topAgentEntry
    ? { name: agentById.get(topAgentEntry[0]) ?? "—", count: topAgentEntry[1] }
    : { name: "—", count: 0 };

  const pipelineMap = new Map<string, number>();
  for (const l of leads) pipelineMap.set(l.status, (pipelineMap.get(l.status) ?? 0) + 1);
  const pipeline = [...pipelineMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const active = properties.filter((p) => p.status === "nabízí se").length;
  const reserved = properties.filter((p) => p.status === "rezervováno").length;
  const missing = properties.filter((p) => p.has_renovation_data === 0).length;

  return {
    weekStart: start, weekEnd: end,
    newLeads, newClients, nSales, volume, commission, topAgent,
    leadsBySource, pipeline, active, reserved, missing,
  };
}

// ─── 6. Market monitoring (briefings) ─────────────────────────────────────
export type MonitoringConfirmation = {
  district: string;
  time: string;
  portals: string[];
  nextRun: string;
  recentBriefings: { date: string; newCount: number }[];
};

export function setupMarketMonitoring(
  district: string,
  time: string,
  portals: string[],
): MonitoringConfirmation {
  const { briefings } = loadAll();
  const matching = briefings
    .filter((b) => b.district === district)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = matching.slice(0, 7).map((b) => ({
    date: b.date,
    newCount: b.listings.length,
  }));
  // "Next run" = tomorrow morning at `time` (simulated)
  const nextRun = `${addISODays(TODAY_ISO, 1)} ${time}`;
  return {
    district,
    time,
    portals: portals.length
      ? portals
      : ["Sreality.cz", "Bezrealitky.cz", "Reality.iDNES.cz"],
    nextRun,
    recentBriefings: recent,
  };
}

// Helper for /briefings page: today's listings for a given district
export function getBriefing(date: string, district: string) {
  const { briefings } = loadAll();
  return briefings.find((b) => b.date === date && b.district === district);
}
export function listBriefings(district?: string) {
  const { briefings } = loadAll();
  return briefings
    .filter((b) => !district || b.district === district)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Helper for property lookup by ref_code (used by tools)
export function findPropertyByRef(ref: string) {
  return loadAll().properties.find((p) => p.ref_code === ref);
}

// Listings helper for AuditTable urgency button (mock — does nothing in DB)
export function getAvailablePropertyRefs(limit = 12) {
  return loadAll()
    .properties
    .filter((p) => p.status === "nabízí se")
    .slice(0, limit)
    .map((p) => p.ref_code);
}

export type { FeedListing };

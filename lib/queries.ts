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
  salesVolume: number; // součet prodejních cen v Kč
  salesAvgPrice: number; // průměrná prodejní cena
  commission: number; // součet provizí v Kč
};
export type TrendResult = {
  monthsBack: number;
  district?: string;
  series: TrendPoint[];
  totalLeads: number;
  totalSales: number;
  totalVolume: number;
  totalCommission: number;
  avgPricePerSale: number; // průměr přes celé období
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
    series.push({
      month: `${CZ_MONTHS[m]} ${y}`, isoMonth: iso,
      leads: 0, sales: 0, salesVolume: 0, salesAvgPrice: 0, commission: 0,
    });
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
    if (i !== undefined) {
      series[i].sales += 1;
      series[i].salesVolume += s.sale_price_czk;
      series[i].commission += s.commission_czk;
    }
  }
  for (const p of series) {
    p.salesAvgPrice = p.sales ? Math.round(p.salesVolume / p.sales) : 0;
  }
  const totalSales = series.reduce((a, p) => a + p.sales, 0);
  const totalVolume = series.reduce((a, p) => a + p.salesVolume, 0);
  return {
    monthsBack,
    district,
    series,
    totalLeads: series.reduce((a, p) => a + p.leads, 0),
    totalSales,
    totalVolume,
    totalCommission: series.reduce((a, p) => a + p.commission, 0),
    avgPricePerSale: totalSales ? Math.round(totalVolume / totalSales) : 0,
  };
}

// ─── Agent stats ──────────────────────────────────────────────────────────
export type AgentStats = {
  id: number;
  name: string;
  email: string;
  activeListings: number;
  totalListings: number;
  salesCount: number;
  salesVolume: number;
  commission: number;
  avgSalePrice: number;
  missingRenovation: number;
};
export type AgentsResult = { agents: AgentStats[] };

export function listAgents(): AgentsResult {
  const { agents, properties, sales } = loadAll();
  return {
    agents: agents.map((a) => {
      const props = properties.filter((p) => p.agent_id === a.id);
      const ags = sales.filter((s) => s.agent_id === a.id);
      const volume = ags.reduce((acc, s) => acc + s.sale_price_czk, 0);
      const commission = ags.reduce((acc, s) => acc + s.commission_czk, 0);
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        activeListings: props.filter((p) => p.status === "nabízí se").length,
        totalListings: props.length,
        salesCount: ags.length,
        salesVolume: volume,
        commission,
        avgSalePrice: ags.length ? Math.round(volume / ags.length) : 0,
        missingRenovation: props.filter((p) => p.has_renovation_data === 0).length,
      };
    }),
  };
}

// ─── Generic property query ───────────────────────────────────────────────
export type PropertyQueryResult = {
  total: number;
  matched: number;
  avgPrice: number;
  byStatus: { status: string; count: number }[];
  rows: {
    ref_code: string; address: string; district: string; type: string;
    price_czk: number; area_m2: number; status: string;
    has_renovation_data: 0 | 1; agent: string;
  }[];
};

export function queryProperties(filters: {
  district?: string;
  type?: string;
  status?: "nabízí se" | "rezervováno" | "prodáno";
  layout?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  hasRenovationData?: boolean;
  limit?: number;
}): PropertyQueryResult {
  const { properties, agents } = loadAll();
  const agentById = new Map(agents.map((a) => [a.id, a.name]));
  let rows = properties.slice();
  if (filters.district) rows = rows.filter((p) => p.district === filters.district);
  if (filters.type) rows = rows.filter((p) => p.type === filters.type);
  if (filters.status) rows = rows.filter((p) => p.status === filters.status);
  if (filters.layout) rows = rows.filter((p) => p.layout === filters.layout);
  if (filters.minPrice !== undefined) rows = rows.filter((p) => p.price_czk >= filters.minPrice!);
  if (filters.maxPrice !== undefined) rows = rows.filter((p) => p.price_czk <= filters.maxPrice!);
  if (filters.minArea !== undefined) rows = rows.filter((p) => p.area_m2 >= filters.minArea!);
  if (filters.maxArea !== undefined) rows = rows.filter((p) => p.area_m2 <= filters.maxArea!);
  if (filters.hasRenovationData !== undefined) {
    rows = rows.filter((p) => (p.has_renovation_data === 1) === filters.hasRenovationData);
  }
  const matched = rows.length;
  const avgPrice = matched ? Math.round(rows.reduce((a, p) => a + p.price_czk, 0) / matched) : 0;
  const statusMap = new Map<string, number>();
  for (const p of rows) statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({ status, count }));
  const limit = filters.limit ?? 25;
  return {
    total: properties.length,
    matched,
    avgPrice,
    byStatus,
    rows: rows.slice(0, limit).map((p) => ({
      ref_code: p.ref_code, address: p.address, district: p.district, type: p.type,
      price_czk: p.price_czk, area_m2: p.area_m2, status: p.status,
      has_renovation_data: p.has_renovation_data,
      agent: agentById.get(p.agent_id) ?? "—",
    })),
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

// ─── Generic lead query ───────────────────────────────────────────────────
export type LeadQueryResult = {
  total: number;
  matched: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  rows: {
    id: number; full_name: string; email: string; phone: string;
    status: string; source: string; region: string; agent: string;
    property_interest: string; created_at: string;
  }[];
};

export function queryLeads(filters: {
  status?: string;
  source?: string;
  region?: string;
  agentName?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): LeadQueryResult {
  const { leads, sources, agents } = loadAll();
  const srcById = new Map(sources.map((s) => [s.id, s.name]));
  const agentById = new Map(agents.map((a) => [a.id, a.name]));
  let rows = leads.slice();
  if (filters.status) rows = rows.filter((l) => l.status === filters.status);
  if (filters.source) rows = rows.filter((l) => srcById.get(l.source_id) === filters.source);
  if (filters.region) rows = rows.filter((l) => l.region === filters.region);
  if (filters.agentName) {
    rows = rows.filter((l) => agentById.get(l.agent_id) === filters.agentName);
  }
  if (filters.fromDate) rows = rows.filter((l) => l.created_at >= filters.fromDate!);
  if (filters.toDate) rows = rows.filter((l) => l.created_at < filters.toDate!);

  const matched = rows.length;
  const statusMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  for (const r of rows) {
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    const sn = srcById.get(r.source_id) ?? "—";
    sourceMap.set(sn, (sourceMap.get(sn) ?? 0) + 1);
  }
  const limit = filters.limit ?? 25;
  return {
    total: leads.length,
    matched,
    byStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    bySource: [...sourceMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    rows: rows.slice(0, limit).map((l) => ({
      id: l.id, full_name: l.full_name, email: l.email, phone: l.phone,
      status: l.status,
      source: srcById.get(l.source_id) ?? "—",
      region: l.region,
      agent: agentById.get(l.agent_id) ?? "—",
      property_interest: l.property_interest,
      created_at: l.created_at,
    })),
  };
}

// ─── Generic client query ─────────────────────────────────────────────────
export type ClientQueryResult = {
  total: number;
  matched: number;
  byType: { type: string; count: number }[];
  bySource: { source: string; count: number }[];
  rows: {
    id: number; full_name: string; email: string; phone: string;
    type: string; source: string; region: string; created_at: string;
  }[];
};

export function queryClients(filters: {
  type?: "prodávající" | "kupující";
  source?: string;
  region?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): ClientQueryResult {
  const { clients, sources } = loadAll();
  const srcById = new Map(sources.map((s) => [s.id, s.name]));
  let rows = clients.slice();
  if (filters.type) rows = rows.filter((c) => c.type === filters.type);
  if (filters.source) rows = rows.filter((c) => srcById.get(c.source_id) === filters.source);
  if (filters.region) rows = rows.filter((c) => c.region === filters.region);
  if (filters.fromDate) rows = rows.filter((c) => c.created_at >= filters.fromDate!);
  if (filters.toDate) rows = rows.filter((c) => c.created_at < filters.toDate!);

  const matched = rows.length;
  const typeMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  for (const r of rows) {
    typeMap.set(r.type, (typeMap.get(r.type) ?? 0) + 1);
    const sn = srcById.get(r.source_id) ?? "—";
    sourceMap.set(sn, (sourceMap.get(sn) ?? 0) + 1);
  }
  const limit = filters.limit ?? 25;
  return {
    total: clients.length,
    matched,
    byType: [...typeMap.entries()].map(([type, count]) => ({ type, count })),
    bySource: [...sourceMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    rows: rows.slice(0, limit).map((c) => ({
      id: c.id, full_name: c.full_name, email: c.email, phone: c.phone,
      type: c.type,
      source: srcById.get(c.source_id) ?? "—",
      region: c.region,
      created_at: c.created_at,
    })),
  };
}

// ─── Sales query + aggregations ──────────────────────────────────────────
export type SalesQueryResult = {
  total: number;
  matched: number;
  volume: number;
  commission: number;
  avgPrice: number;
  byAgent: { agent: string; count: number; volume: number; commission: number }[];
  byDistrict: { district: string; count: number; volume: number }[];
  rows: {
    id: number; ref_code: string; address: string; district: string;
    sale_price_czk: number; commission_czk: number; agent: string; closed_at: string;
  }[];
};

export function querySales(filters: {
  fromDate?: string;
  toDate?: string;
  district?: string;
  agentName?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}): SalesQueryResult {
  const { sales, properties, agents } = loadAll();
  const propById = new Map(properties.map((p) => [p.id, p]));
  const agentById = new Map(agents.map((a) => [a.id, a.name]));

  let rows = sales.slice();
  if (filters.fromDate) rows = rows.filter((s) => s.closed_at >= filters.fromDate!);
  if (filters.toDate) rows = rows.filter((s) => s.closed_at < filters.toDate!);
  if (filters.agentName) rows = rows.filter((s) => agentById.get(s.agent_id) === filters.agentName);
  if (filters.district) {
    rows = rows.filter((s) => propById.get(s.property_id)?.district === filters.district);
  }
  if (filters.minPrice !== undefined) rows = rows.filter((s) => s.sale_price_czk >= filters.minPrice!);
  if (filters.maxPrice !== undefined) rows = rows.filter((s) => s.sale_price_czk <= filters.maxPrice!);

  const matched = rows.length;
  const volume = rows.reduce((a, s) => a + s.sale_price_czk, 0);
  const commission = rows.reduce((a, s) => a + s.commission_czk, 0);
  const avgPrice = matched ? Math.round(volume / matched) : 0;

  const agMap = new Map<string, { count: number; volume: number; commission: number }>();
  const dsMap = new Map<string, { count: number; volume: number }>();
  for (const s of rows) {
    const an = agentById.get(s.agent_id) ?? "—";
    const cur = agMap.get(an) ?? { count: 0, volume: 0, commission: 0 };
    agMap.set(an, {
      count: cur.count + 1,
      volume: cur.volume + s.sale_price_czk,
      commission: cur.commission + s.commission_czk,
    });
    const d = propById.get(s.property_id)?.district ?? "—";
    const curD = dsMap.get(d) ?? { count: 0, volume: 0 };
    dsMap.set(d, { count: curD.count + 1, volume: curD.volume + s.sale_price_czk });
  }

  const limit = filters.limit ?? 25;
  return {
    total: sales.length,
    matched, volume, commission, avgPrice,
    byAgent: [...agMap.entries()].map(([agent, v]) => ({ agent, ...v })).sort((a, b) => b.volume - a.volume),
    byDistrict: [...dsMap.entries()].map(([district, v]) => ({ district, ...v })).sort((a, b) => b.volume - a.volume),
    rows: rows.slice(0, limit).map((s) => {
      const p = propById.get(s.property_id);
      return {
        id: s.id,
        ref_code: p?.ref_code ?? "—",
        address: p?.address ?? "—",
        district: p?.district ?? "—",
        sale_price_czk: s.sale_price_czk,
        commission_czk: s.commission_czk,
        agent: agentById.get(s.agent_id) ?? "—",
        closed_at: s.closed_at,
      };
    }),
  };
}

// ─── Detail tools ────────────────────────────────────────────────────────
export function getPropertyDetail(refCode: string) {
  const { properties, agents, clients, sales } = loadAll();
  const p = properties.find((x) => x.ref_code === refCode);
  if (!p) return { found: false as const, refCode };
  const agentName = agents.find((a) => a.id === p.agent_id)?.name ?? "—";
  const owner = clients.find((c) => c.id === p.owner_client_id);
  const sale = sales.find((s) => s.property_id === p.id);
  return {
    found: true as const,
    property: p,
    agent: agentName,
    owner: owner ? { name: owner.full_name, email: owner.email, phone: owner.phone } : null,
    sale: sale
      ? {
          sale_price_czk: sale.sale_price_czk,
          commission_czk: sale.commission_czk,
          closed_at: sale.closed_at,
        }
      : null,
  };
}

export function getAgentDetail(agentName: string) {
  const { agents, properties, sales } = loadAll();
  const a = agents.find((x) => x.name.toLowerCase() === agentName.toLowerCase());
  if (!a) return { found: false as const, agentName };
  const props = properties.filter((p) => p.agent_id === a.id);
  const ags = sales.filter((s) => s.agent_id === a.id);
  return {
    found: true as const,
    agent: a,
    properties: {
      total: props.length,
      active: props.filter((p) => p.status === "nabízí se").length,
      reserved: props.filter((p) => p.status === "rezervováno").length,
      sold: props.filter((p) => p.status === "prodáno").length,
      missingRenovation: props.filter((p) => p.has_renovation_data === 0).length,
    },
    sales: {
      count: ags.length,
      volume: ags.reduce((acc, s) => acc + s.sale_price_czk, 0),
      commission: ags.reduce((acc, s) => acc + s.commission_czk, 0),
    },
    recentSales: ags
      .sort((x, y) => (x.closed_at < y.closed_at ? 1 : -1))
      .slice(0, 5)
      .map((s) => {
        const p = properties.find((pp) => pp.id === s.property_id);
        return {
          ref_code: p?.ref_code ?? "—",
          address: p?.address ?? "—",
          sale_price_czk: s.sale_price_czk,
          closed_at: s.closed_at,
        };
      }),
    activeListings: props
      .filter((p) => p.status === "nabízí se")
      .slice(0, 5)
      .map((p) => ({
        ref_code: p.ref_code, address: p.address,
        type: p.type, price_czk: p.price_czk,
      })),
  };
}

// ─── Lead funnel ──────────────────────────────────────────────────────────
const FUNNEL_ORDER = ["nový", "kontaktován", "kvalifikován", "konvertován", "ztracený"] as const;

export function getLeadFunnel(monthsBack?: number, district?: string) {
  const { leads } = loadAll();
  let rows = leads.slice();
  if (district) rows = rows.filter((l) => l.region === district);
  if (monthsBack !== undefined) {
    const [ty, tm] = TODAY_ISO.split("-").map(Number);
    let y = ty, m = tm - monthsBack;
    while (m <= 0) { m += 12; y -= 1; }
    const cutoff = `${y}-${String(m).padStart(2, "0")}-01`;
    rows = rows.filter((l) => l.created_at >= cutoff);
  }
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  const total = rows.length;
  const stages = FUNNEL_ORDER.map((status) => {
    const count = counts.get(status) ?? 0;
    return { status, count, pct: total ? +(count / total * 100).toFixed(1) : 0 };
  });
  const converted = counts.get("konvertován") ?? 0;
  const qualified = counts.get("kvalifikován") ?? 0;
  return {
    total,
    district,
    monthsBack,
    stages,
    conversionRate: total ? +(converted / total * 100).toFixed(1) : 0,
    qualificationRate: total ? +((converted + qualified) / total * 100).toFixed(1) : 0,
  };
}

// ─── Compare two periods ─────────────────────────────────────────────────
export type PeriodKey = "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "thisYear" | "lastYear";

function periodRange(key: PeriodKey): { from: string; toExcl: string; label: string } {
  const [ty, tm, td] = TODAY_ISO.split("-").map(Number);
  const today = new Date(Date.UTC(ty, tm - 1, td));
  const iso = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
  const dow = today.getUTCDay() || 7; // Mon=1 ... Sun=7
  const startOfThisWeek = addDays(today, -(dow - 1));
  switch (key) {
    case "thisWeek":
      return { from: iso(startOfThisWeek), toExcl: iso(addDays(startOfThisWeek, 7)), label: "tento týden" };
    case "lastWeek":
      return { from: iso(addDays(startOfThisWeek, -7)), toExcl: iso(startOfThisWeek), label: "minulý týden" };
    case "thisMonth":
      return { from: `${ty}-${String(tm).padStart(2, "0")}-01`,
        toExcl: tm === 12 ? `${ty + 1}-01-01` : `${ty}-${String(tm + 1).padStart(2, "0")}-01`, label: "tento měsíc" };
    case "lastMonth": {
      const m = tm === 1 ? 12 : tm - 1;
      const y = tm === 1 ? ty - 1 : ty;
      return { from: `${y}-${String(m).padStart(2, "0")}-01`,
        toExcl: `${ty}-${String(tm).padStart(2, "0")}-01`, label: "minulý měsíc" };
    }
    case "thisQuarter": {
      const q = Math.floor((tm - 1) / 3);
      const m = q * 3 + 1;
      return { from: `${ty}-${String(m).padStart(2, "0")}-01`,
        toExcl: q === 3 ? `${ty + 1}-01-01` : `${ty}-${String(m + 3).padStart(2, "0")}-01`,
        label: `Q${q + 1} ${ty}` };
    }
    case "lastQuarter": {
      const q = Math.floor((tm - 1) / 3);
      const prevQ = q === 0 ? 3 : q - 1;
      const prevY = q === 0 ? ty - 1 : ty;
      const m = prevQ * 3 + 1;
      const endY = prevQ === 3 ? prevY + 1 : prevY;
      const endM = prevQ === 3 ? 1 : m + 3;
      return { from: `${prevY}-${String(m).padStart(2, "0")}-01`,
        toExcl: `${endY}-${String(endM).padStart(2, "0")}-01`,
        label: `Q${prevQ + 1} ${prevY}` };
    }
    case "thisYear":
      return { from: `${ty}-01-01`, toExcl: `${ty + 1}-01-01`, label: `${ty}` };
    case "lastYear":
      return { from: `${ty - 1}-01-01`, toExcl: `${ty}-01-01`, label: `${ty - 1}` };
  }
}

export type Metric = "leads" | "sales" | "salesVolume" | "commission" | "newClients";

function metricFor(metric: Metric, fromIso: string, toExcl: string): number {
  const { leads, sales, clients } = loadAll();
  switch (metric) {
    case "leads": return leads.filter((l) => inRange(l.created_at, fromIso, toExcl)).length;
    case "sales": return sales.filter((s) => inRange(s.closed_at, fromIso, toExcl)).length;
    case "salesVolume": return sales.filter((s) => inRange(s.closed_at, fromIso, toExcl))
      .reduce((a, s) => a + s.sale_price_czk, 0);
    case "commission": return sales.filter((s) => inRange(s.closed_at, fromIso, toExcl))
      .reduce((a, s) => a + s.commission_czk, 0);
    case "newClients": return clients.filter((c) => inRange(c.created_at, fromIso, toExcl)).length;
  }
}

export function comparePeriods(metric: Metric, periodA: PeriodKey, periodB: PeriodKey) {
  const a = periodRange(periodA);
  const b = periodRange(periodB);
  const va = metricFor(metric, a.from, a.toExcl);
  const vb = metricFor(metric, b.from, b.toExcl);
  const diff = va - vb;
  const pct = vb === 0 ? null : +(diff / vb * 100).toFixed(1);
  return {
    metric,
    periodA: { ...a, value: va, key: periodA },
    periodB: { ...b, value: vb, key: periodB },
    diff,
    pct,
    direction: diff > 0 ? "nárůst" as const : diff < 0 ? "pokles" as const : "beze změny" as const,
  };
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

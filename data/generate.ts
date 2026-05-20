/**
 * Deterministic synthetic data generator for the Back Office Agent.
 * Port of the original Python generate_data.py — same shapes, distributions
 * and counts target; output JSON instead of SQLite.
 *
 * Run: npm run seed
 */
import fs from "node:fs";
import path from "node:path";

// ─── Seeded RNG (Mulberry32) ──────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 42;
const TODAY = new Date(Date.UTC(2026, 4, 17)); // 2026-05-17
const HERE = path.dirname(new URL(import.meta.url).pathname);

const rand = mulberry32(SEED);
const randInt = (lo: number, hi: number) => Math.floor(rand() * (hi - lo + 1)) + lo;
const choice = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const sample = <T,>(arr: readonly T[], k: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  k = Math.min(k, pool.length);
  while (out.length < k) {
    const i = Math.floor(rand() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
};
const weighted = <T,>(items: readonly T[], weights: readonly number[]): T => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};
const uniform = (lo: number, hi: number) => rand() * (hi - lo) + lo;

// ─── Constants ────────────────────────────────────────────────────────────
const AGENTS = [
  "Jana Nováková",
  "Petr Svoboda",
  "Lucie Dvořáková",
  "Martin Černý",
  "Eva Procházková",
] as const;

const SOURCES_W: readonly [string, number][] = [
  ["Sreality.cz", 30],
  ["Web firmy", 20],
  ["Doporučení", 16],
  ["Bezrealitky.cz", 12],
  ["Sociální sítě", 10],
  ["Walk-in", 7],
  ["Placená inzerce", 5],
];

const DISTRICTS = [
  "Praha-Holešovice",
  "Praha-Vinohrady",
  "Praha-Smíchov",
  "Praha-Karlín",
  "Praha-Dejvice",
  "Praha-Žižkov",
  "Brno-střed",
  "Plzeň-město",
] as const;
const DISTRICT_W = [22, 14, 13, 12, 11, 10, 10, 8];

const PROPERTY_TYPES = [
  "Byt 1+kk",
  "Byt 2+kk",
  "Byt 3+1",
  "Byt 4+1",
  "Rodinný dům",
  "Komerční prostor",
  "Pozemek",
] as const;

const ENERGY = ["A", "B", "C", "D", "E", "F", "G"] as const;

const FIRST = [
  "Jan","Petr","Tomáš","Jakub","Lukáš","Martin","Michal","David","Ondřej","Pavel",
  "Marie","Jana","Eva","Hana","Anna","Lenka","Kateřina","Lucie","Tereza","Veronika",
] as const;
const LAST = [
  "Novák","Svoboda","Novotný","Dvořák","Černý","Procházka","Kučera","Veselý",
  "Horák","Němec","Marek","Pospíšil","Pokorný","Hájek","Jelínek","Král",
  "Růžička","Beneš","Fiala","Sedláček",
] as const;
const STREETS = [
  "Komunardů","Dělnická","Jankovcova","Argentinská","Bubenská","Korunní","Vinohradská",
  "Bělehradská","Štěpánská","Karlínské náměstí","Sokolovská","Nádražní","Plzeňská",
  "Veveří","Lidická",
] as const;

const RENO_MODS = [
  "Kompletní rekonstrukce bytu 2019",
  "Nová okna a zateplení fasády",
  "Rekonstrukce koupelny a kuchyně",
  "Půdní vestavba, statické úpravy",
  "Výměna rozvodů, nové podlahy",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────
function diacriticless(s: string) {
  return s
    .toLowerCase()
    .replace(/ /g, ".")
    .replace(/á/g, "a").replace(/č/g, "c").replace(/ď/g, "d")
    .replace(/é/g, "e").replace(/ě/g, "e").replace(/í/g, "i")
    .replace(/ň/g, "n").replace(/ó/g, "o").replace(/ř/g, "r")
    .replace(/š/g, "s").replace(/ť/g, "t").replace(/ú/g, "u")
    .replace(/ů/g, "u").replace(/ý/g, "y").replace(/ž/g, "z");
}
const fullName = () => `${choice(FIRST)} ${choice(LAST)}`;
const emailFor = (name: string, i: number | string) =>
  `${diacriticless(name)}${i}@email.cz`;
const phone = () =>
  `+420 ${randInt(601, 779)} ${randInt(100, 999)} ${randInt(100, 999)}`;

function monthList(n: number, end = TODAY): [number, number][] {
  const out: [number, number][] = [];
  let y = end.getUTCFullYear();
  let m = end.getUTCMonth() + 1;
  for (let i = 0; i < n; i++) {
    out.push([y, m]);
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }
  return out.reverse();
}

function lastDay(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function randomDtInMonth(y: number, m: number): Date {
  let ld = lastDay(y, m);
  if (y === TODAY.getUTCFullYear() && m === TODAY.getUTCMonth() + 1) {
    ld = Math.min(ld, TODAY.getUTCDate());
  }
  const d = randInt(1, Math.max(1, ld));
  const hh = randInt(8, 18);
  const mm = choice([0, 15, 30, 45]);
  return new Date(Date.UTC(y, m - 1, d, hh, mm));
}

function fmtDT(d: Date) {
  // YYYY-MM-DD HH:MM (UTC parts — interpreted as local Europe/Prague-ish wall clock for demo)
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
function fmtD(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}
function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86_400_000);
}

// ─── Entities ─────────────────────────────────────────────────────────────
export type Agent = { id: number; name: string; email: string };
export type Source = { id: number; name: string };
export type Lead = {
  id: number; full_name: string; email: string; phone: string;
  source_id: number; created_at: string; status: string; region: string;
  agent_id: number; property_interest: string;
};
export type Client = {
  id: number; full_name: string; email: string; phone: string;
  type: "prodávající" | "kupující";
  source_id: number; lead_id: number | null; created_at: string; region: string;
};
export type Property = {
  id: number; ref_code: string; address: string; district: string;
  type: string; price_czk: number; area_m2: number; layout: string;
  status: "prodáno" | "rezervováno" | "nabízí se";
  listed_at: string; sold_at: string | null;
  renovation_year: number | null; construction_modifications: string | null;
  has_renovation_data: 0 | 1; energy_class: string;
  owner_client_id: number; agent_id: number;
};
export type Sale = {
  id: number; property_id: number; client_id: number | null; agent_id: number;
  sale_price_czk: number; commission_czk: number; closed_at: string;
};
export type CalendarEvent = { date: string; start: string; end: string; title: string };
export type CalendarPayload = {
  owner: string; timezone: string; generated_for: string;
  working_hours: { start: string; end: string; workdays: number[] };
  events: CalendarEvent[];
};
export type FeedListing = {
  id: string; portal: string; title: string; district: string;
  type: string; area_m2: number; price_czk: number; url: string; published: string;
};

// ─── Build ────────────────────────────────────────────────────────────────
function build() {
  const agents: Agent[] = AGENTS.map((name, i) => ({
    id: i + 1, name,
    email: diacriticless(name).replace(/@email\.cz$/, "") + "@realityholding.cz",
  }));
  const sources: Source[] = SOURCES_W.map(([name], i) => ({ id: i + 1, name }));
  const sourceWeights = SOURCES_W.map(([, w]) => w);
  const weightedSource = () => weighted(sources, sourceWeights).id;

  const months14 = monthList(14);

  // Seller clients (own listed properties)
  const clients: Client[] = [];
  for (let i = 0; i < 60; i++) {
    const nm = fullName();
    const [y, m] = choice(months14);
    const dt = randomDtInMonth(y, m);
    clients.push({
      id: clients.length + 1,
      full_name: nm,
      email: emailFor(nm, clients.length + 1),
      phone: phone(),
      type: "prodávající",
      source_id: weightedSource(),
      lead_id: null,
      created_at: fmtDT(dt),
      region: choice(DISTRICTS),
    });
  }
  const sellerIds = clients.map((c) => c.id);

  // Properties
  const properties: Property[] = [];
  let ref = 1000;
  for (let pid = 1; pid <= 180; pid++) {
    ref += 1;
    const district = weighted(DISTRICTS, DISTRICT_W);
    const ptype = choice(PROPERTY_TYPES);
    const area = randInt(28, 220);
    const price = Math.floor((area * randInt(75000, 145000)) / 1000) * 1000;
    const layout = ptype.startsWith("Byt") ? ptype : "-";
    const listedDt = randomDtInMonth(...choice(months14));
    const roll = rand();
    let status: Property["status"];
    if (roll < 0.33) status = "prodáno";
    else if (roll < 0.45) status = "rezervováno";
    else status = "nabízí se";
    let soldAt: string | null = null;
    if (status === "prodáno") {
      const deltaDays = randInt(20, 160);
      let sd = addDays(listedDt, deltaDays);
      if (sd.getTime() > TODAY.getTime()) {
        sd = new Date(addDays(TODAY, -randInt(1, 25)).getTime());
        sd.setUTCHours(14, 0, 0, 0);
      }
      soldAt = fmtDT(sd);
    }
    let renovationYear: number | null = null;
    let constr: string | null = null;
    let hasData: 0 | 1 = 1;
    if (rand() < 0.35) {
      hasData = 0;
    } else {
      renovationYear = randInt(2005, 2024);
      constr = choice(RENO_MODS);
    }
    const cityPart = district.split("-")[1] ?? district;
    properties.push({
      id: pid,
      ref_code: `RH-${ref}`,
      address: `${choice(STREETS)} ${randInt(1, 80)}, ${cityPart}`,
      district,
      type: ptype,
      price_czk: price,
      area_m2: area,
      layout,
      status,
      listed_at: fmtDT(listedDt),
      sold_at: soldAt,
      renovation_year: renovationYear,
      construction_modifications: constr,
      has_renovation_data: hasData,
      energy_class: choice(ENERGY),
      owner_client_id: choice(sellerIds),
      agent_id: choice(agents).id,
    });
  }

  // Leads — 14 months, gentle upward trend + noise
  const leads: Lead[] = [];
  const convertedLeads: { id: number; nm: string; dt: Date }[] = [];
  months14.forEach(([y, m], idx) => {
    const base = 22 + Math.floor(idx * 1.1);
    const count = Math.max(8, base + randInt(-6, 7));
    for (let i = 0; i < count; i++) {
      const nm = fullName();
      const dt = randomDtInMonth(y, m);
      const r = rand();
      let status: string;
      if (r < 0.28) status = "konvertován";
      else if (r < 0.45) status = "kvalifikován";
      else if (r < 0.70) status = "kontaktován";
      else if (r < 0.85) status = "nový";
      else status = "ztracený";
      const id = leads.length + 1;
      leads.push({
        id, full_name: nm, email: emailFor(nm, id), phone: phone(),
        source_id: weightedSource(), created_at: fmtDT(dt),
        status, region: choice(DISTRICTS), agent_id: choice(agents).id,
        property_interest: choice(PROPERTY_TYPES),
      });
      if (status === "konvertován") convertedLeads.push({ id, nm, dt });
    }
  });

  // Buyer clients from converted leads
  for (const { id: lid, nm, dt } of convertedLeads) {
    const cid = clients.length + 1;
    clients.push({
      id: cid, full_name: nm, email: emailFor(nm, cid), phone: phone(),
      type: "kupující", source_id: weightedSource(), lead_id: lid,
      created_at: fmtDT(addDays(dt, randInt(2, 30))),
      region: choice(DISTRICTS),
    });
  }
  const buyerIds = clients.filter((c) => c.type === "kupující").map((c) => c.id);

  // Sales — one per sold property
  const sales: Sale[] = [];
  for (const p of properties) {
    if (p.status !== "prodáno" || !p.sold_at) continue;
    const factor = uniform(0.93, 1.04);
    const salePrice = Math.floor((p.price_czk * factor) / 1000) * 1000;
    const commission = Math.floor(salePrice * uniform(0.03, 0.05));
    sales.push({
      id: sales.length + 1,
      property_id: p.id,
      client_id: buyerIds.length ? choice(buyerIds) : null,
      agent_id: p.agent_id,
      sale_price_czk: salePrice,
      commission_czk: commission,
      closed_at: p.sold_at,
    });
  }

  // Calendar
  const fixedTitles = [
    "Interní porada týmu","Prohlídka nemovitosti","Schůzka s klientem",
    "Call s vedením","Příprava podkladů","Jednání o ceně",
  ];
  const events: CalendarEvent[] = [];
  let d = new Date(TODAY);
  let added = 0;
  while (added < 12) {
    const dow = d.getUTCDay();
    if (dow >= 1 && dow <= 5) {
      added += 1;
      const nEv = randInt(0, 3);
      const hours = sample([9, 10, 11, 13, 14, 15, 16], Math.min(nEv, 7)).sort((a, b) => a - b);
      for (const h of hours) {
        const dur = choice([1, 1, 2]);
        const p2 = (n: number) => String(n).padStart(2, "0");
        events.push({
          date: fmtD(d),
          start: `${p2(h)}:00`,
          end: `${p2(h + dur)}:00`,
          title: choice(fixedTitles),
        });
      }
    }
    d = addDays(d, 1);
  }
  const calendar: CalendarPayload = {
    owner: "Pepa (Back Office Manager)",
    timezone: "Europe/Prague",
    generated_for: fmtD(TODAY),
    working_hours: { start: "09:00", end: "18:00", workdays: [1, 2, 3, 4, 5] },
    events,
  };

  // Mock real-estate feed — historical baseline + guaranteed daily content for
  // Praha-Holešovice so the morning briefings page is never empty.
  const portals = ["Sreality.cz", "Bezrealitky.cz", "Reality.iDNES.cz"];
  const listings: FeedListing[] = [];
  let lid = 0;
  const pushListing = (pub: Date, district: string) => {
    lid += 1;
    const ptype = choice(PROPERTY_TYPES);
    const area = randInt(30, 160);
    const price = Math.floor((area * randInt(80000, 150000)) / 1000) * 1000;
    listings.push({
      id: `L${String(lid).padStart(4, "0")}`,
      portal: choice(portals),
      title: `${ptype}, ${area} m², ${district}`,
      district,
      type: ptype,
      area_m2: area,
      price_czk: price,
      url: `https://example-realitni-portal.cz/nabidka/L${String(lid).padStart(4, "0")}`,
      published: fmtD(pub),
    });
  };
  for (let back = 10; back >= 0; back--) {
    const pub = addDays(TODAY, -back);
    // baseline: 2–5 random-district listings per day
    const n = randInt(2, 5);
    for (let i = 0; i < n; i++) {
      const district = weighted(DISTRICTS, [20, 14, 13, 12, 11, 10, 10, 10]);
      pushListing(pub, district);
    }
    // guarantee: each of the last 7 days has 1–3 Praha-Holešovice listings
    if (back <= 6) {
      const m = randInt(1, 3);
      for (let i = 0; i < m; i++) pushListing(pub, "Praha-Holešovice");
    }
  }
  const feed = { updated: fmtD(TODAY), listings };
  const seen = {
    seen_ids: listings.filter((x) => x.published < fmtD(TODAY)).map((x) => x.id),
    last_run: fmtD(addDays(TODAY, -1)),
  };

  // Pre-generated daily briefings — last 7 days up to TODAY for Praha-Holešovice
  const briefings: { date: string; district: string; listings: FeedListing[] }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = addDays(TODAY, -i);
    const dateStr = fmtD(day);
    const ofDay = listings.filter(
      (l) => l.published === dateStr && l.district === "Praha-Holešovice",
    );
    briefings.push({ date: dateStr, district: "Praha-Holešovice", listings: ofDay });
  }

  return { agents, sources, leads, clients, properties, sales, calendar, feed, seen, briefings };
}

function writeJSON(file: string, data: unknown) {
  fs.writeFileSync(path.join(HERE, file), JSON.stringify(data, null, 2), "utf8");
}

const data = build();
writeJSON("agents.json", data.agents);
writeJSON("sources.json", data.sources);
writeJSON("leads.json", data.leads);
writeJSON("clients.json", data.clients);
writeJSON("properties.json", data.properties);
writeJSON("sales.json", data.sales);
writeJSON("calendar.json", data.calendar);
writeJSON("listings_feed.json", data.feed);
writeJSON("seen_listings.json", data.seen);
for (const b of data.briefings) {
  writeJSON(path.join("briefings", `${b.date}.json`), b);
}

const missing = data.properties.filter((p) => p.has_renovation_data === 0).length;
const missingPct = ((missing / data.properties.length) * 100).toFixed(1);

console.log("✅ Synthetic data generated (seed=%d, reference date=%s)", SEED, fmtD(TODAY));
console.log(`  - agents          : ${data.agents.length}`);
console.log(`  - sources         : ${data.sources.length}`);
console.log(`  - leads           : ${data.leads.length}`);
console.log(`  - clients         : ${data.clients.length} (sellers ${data.clients.filter((c) => c.type === "prodávající").length}, buyers ${data.clients.filter((c) => c.type === "kupující").length})`);
console.log(`  - properties      : ${data.properties.length} (missing renovation: ${missing} = ${missingPct} %)`);
console.log(`  - sales           : ${data.sales.length}`);
console.log(`  - calendar events : ${data.calendar.events.length}`);
console.log(`  - feed listings   : ${data.feed.listings.length}`);
console.log(`  - briefings       : ${data.briefings.length}`);

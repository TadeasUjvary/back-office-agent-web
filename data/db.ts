import fs from "node:fs";
import path from "node:path";
import type {
  Agent, Source, Lead, Client, Property, Sale,
  CalendarPayload, FeedListing,
} from "./generate";

const DATA_DIR = path.join(process.cwd(), "data");

function readJSON<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
}

export type Feed = { updated: string; listings: FeedListing[] };
export type Briefing = { date: string; district: string; listings: FeedListing[] };

let cache: {
  agents: Agent[];
  sources: Source[];
  leads: Lead[];
  clients: Client[];
  properties: Property[];
  sales: Sale[];
  calendar: CalendarPayload;
  feed: Feed;
  briefings: Briefing[];
} | null = null;

export function loadAll() {
  if (cache) return cache;
  const briefingsDir = path.join(DATA_DIR, "briefings");
  const briefings: Briefing[] = fs
    .readdirSync(briefingsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(briefingsDir, f), "utf8")) as Briefing);
  cache = {
    agents: readJSON<Agent[]>("agents.json"),
    sources: readJSON<Source[]>("sources.json"),
    leads: readJSON<Lead[]>("leads.json"),
    clients: readJSON<Client[]>("clients.json"),
    properties: readJSON<Property[]>("properties.json"),
    sales: readJSON<Sale[]>("sales.json"),
    calendar: readJSON<CalendarPayload>("calendar.json"),
    feed: readJSON<Feed>("listings_feed.json"),
    briefings,
  };
  return cache;
}

export const TODAY_ISO = "2026-05-17";

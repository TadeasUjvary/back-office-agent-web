/**
 * Integrations registry — mock pro UI ukázku.
 * V reálném SaaS by tu byly OAuth tokeny, scope rights, last_sync timestamps.
 */

export type IntegrationId = "sheets" | "drive" | "calendar" | "gmail" | "crm";

export type Integration = {
  id: IntegrationId;
  name: string;
  vendor: string;
  description: string;
  scopes: string[];
  /** Brand color (Tailwind classes for badge bg/text) */
  badgeBg: string;
  badgeText: string;
  /** Letter/glyph rendered inside the colored circle */
  glyph: string;
};

export const INTEGRATIONS: Record<IntegrationId, Integration> = {
  sheets: {
    id: "sheets",
    name: "Google Sheets",
    vendor: "Google Workspace",
    description: "Tabulka klientů, leadů, prodejů, audit dat. Read + write.",
    scopes: ["spreadsheets.readonly", "spreadsheets.write"],
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    glyph: "S",
  },
  drive: {
    id: "drive",
    name: "Google Drive",
    vendor: "Google Workspace",
    description: "Smlouvy, dokumenty, prezentace, exporty reportů.",
    scopes: ["drive.file", "drive.readonly"],
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    glyph: "D",
  },
  calendar: {
    id: "calendar",
    name: "Google Calendar",
    vendor: "Google Workspace",
    description: "Pepův kalendář prohlídek a schůzek, volné termíny.",
    scopes: ["calendar.events", "calendar.readonly"],
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    glyph: "C",
  },
  gmail: {
    id: "gmail",
    name: "Gmail",
    vendor: "Google Workspace",
    description: "Odesílání e-mailů zájemcům, drafty, follow-upy.",
    scopes: ["gmail.send", "gmail.compose"],
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
    glyph: "M",
  },
  crm: {
    id: "crm",
    name: "Firemní CRM",
    vendor: "Reality Holding · interní",
    description: "Databáze nemovitostí, makléřů, monitoring realitních portálů.",
    scopes: ["properties.read", "agents.read", "monitor.write"],
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    glyph: "RH",
  },
};

/** Které integrace stojí za odpovědí daného toolu — pořadí = relevance. */
export const TOOL_SOURCES: Record<string, IntegrationId[]> = {
  // Read
  getNewClients: ["sheets", "crm"],
  getLeadsAndSalesTrend: ["sheets", "crm"],
  proposeViewingSlots: ["calendar", "gmail"],
  auditMissingRenovationData: ["sheets", "crm"],
  weeklyReport: ["sheets", "drive"],
  setupMarketMonitoring: ["crm"],
  listAgents: ["crm"],
  queryProperties: ["sheets", "crm"],
  queryLeads: ["sheets", "crm"],
  queryClients: ["sheets", "crm"],
  querySales: ["sheets", "crm"],
  getPropertyDetail: ["sheets", "crm"],
  getAgentDetail: ["crm"],
  getLeadFunnel: ["sheets", "crm"],
  comparePeriods: ["sheets"],
  // Write
  sendEmail: ["gmail"],
  createCalendarEvent: ["calendar"],
  logCRMNote: ["crm"],
  urgeAgent: ["gmail", "crm"],
  exportToSheet: ["sheets", "drive"],
  // Web
  fetchUrl: [],
};

export function sourcesFor(toolName: string): Integration[] {
  const ids = TOOL_SOURCES[toolName] ?? [];
  return ids.map((id) => INTEGRATIONS[id]);
}

/**
 * Mocked write/action tools — no side effects on persistent state.
 * They look like SaaS API calls and return realistic confirmation payloads.
 */
import { findPropertyByRef } from "./queries";
import { loadAll } from "@/data/db";

function id() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function mockSendEmail(args: {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  attachments?: string[];
}) {
  return {
    sent: true,
    messageId: `gmail-${id()}`,
    sentAt: new Date().toISOString(),
    provider: "Gmail",
    from: "pepa@realityholding.cz",
    to: args.to,
    cc: args.cc ?? [],
    subject: args.subject,
    bodyPreview: args.body.slice(0, 200),
    attachments: args.attachments ?? [],
  };
}

export function mockAddCalendarEvent(args: {
  date: string;
  startTime: string;
  durationMinutes: number;
  title: string;
  attendees?: string[];
  location?: string;
  notes?: string;
}) {
  return {
    created: true,
    eventId: `cal-${id()}`,
    provider: "Google Calendar",
    calendar: "pepa@realityholding.cz",
    title: args.title,
    date: args.date,
    startTime: args.startTime,
    durationMinutes: args.durationMinutes,
    attendees: args.attendees ?? [],
    location: args.location ?? "—",
    notes: args.notes ?? "",
    htmlLink: `https://calendar.google.com/event?eid=mock-${id().toLowerCase()}`,
  };
}

export function mockLogCRMNote(args: {
  entity: "property" | "lead" | "client" | "agent";
  ref: string;
  note: string;
  tag?: string;
}) {
  // Best-effort: resolve property by ref_code so we can show it
  let entityLabel = `${args.entity}#${args.ref}`;
  if (args.entity === "property") {
    const p = findPropertyByRef(args.ref);
    if (p) entityLabel = `${p.ref_code} · ${p.address}`;
  }
  return {
    logged: true,
    noteId: `crm-${id()}`,
    provider: "Firemní CRM",
    entity: args.entity,
    entityLabel,
    note: args.note,
    tag: args.tag ?? "general",
    by: "Pepa",
    at: new Date().toISOString(),
  };
}

export function mockUrgeAgent(args: {
  agentName: string;
  subject: string;
  itemCount?: number;
  deadline?: string;
}) {
  const { agents } = loadAll();
  const a = agents.find((x) => x.name.toLowerCase() === args.agentName.toLowerCase());
  if (!a) {
    return { sent: false as const, reason: `Makléř '${args.agentName}' nebyl nalezen.` };
  }
  return {
    sent: true as const,
    messageId: `gmail-${id()}`,
    provider: "Gmail",
    to: a.email,
    agentName: a.name,
    subject: args.subject,
    itemCount: args.itemCount,
    deadline: args.deadline ?? "do 5 prac. dnů",
    sentAt: new Date().toISOString(),
  };
}

export function mockExportToSheet(args: {
  entity: "properties" | "leads" | "clients" | "sales" | "audit";
  rowCount: number;
  title?: string;
}) {
  const title = args.title ?? `${args.entity}-export-${new Date().toISOString().slice(0, 10)}`;
  return {
    exported: true,
    provider: "Google Sheets",
    sheetId: `sheets-${id().toLowerCase()}`,
    title,
    entity: args.entity,
    rowCount: args.rowCount,
    url: `https://docs.google.com/spreadsheets/d/mock-${id().toLowerCase()}/edit`,
    createdAt: new Date().toISOString(),
  };
}

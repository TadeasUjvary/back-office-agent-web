import { loadAll, TODAY_ISO } from "@/data/db";
import {
  weeklyReport,
  getLeadFunnel,
  auditMissingRenovationData,
  getNewClients,
} from "@/lib/queries";

export type DashboardData = {
  today: string;
  totals: {
    properties: number;
    active: number;
    reserved: number;
    sold: number;
    leads: number;
    clients: number;
    agents: number;
    missingReno: number;
  };
  thisMonth: {
    label: string;
    newLeads: number;
    nSales: number;
    volume: number;
    commission: number;
  };
  trend: { month: string; leads: number; sales: number }[];
  topAgents: { name: string; sales: number; volume: number }[];
  funnel: { status: string; count: number; pct: number }[];
  conversionRate: number;
  leadSources: { name: string; count: number }[];
};

export function getDashboard(): DashboardData {
  const { properties, leads, clients, agents, sales } = loadAll();

  const active = properties.filter((p) => p.status === "nabízí se").length;
  const reserved = properties.filter((p) => p.status === "rezervováno").length;
  const sold = properties.filter((p) => p.status === "prodáno").length;
  const missingReno = properties.filter((p) => p.has_renovation_data === 0).length;

  // This month report
  const mr = weeklyReport(undefined, { period: "month", slideCount: 1, includeSlides: false });

  // 6-month trend
  const trendReport = weeklyReport(undefined, { period: "week", slideCount: 1, includeSlides: false });
  void trendReport;
  const trend = build6mTrend();

  // Top agents (all-time)
  const agentSales = new Map<number, { count: number; volume: number }>();
  for (const s of sales) {
    const cur = agentSales.get(s.agent_id) ?? { count: 0, volume: 0 };
    agentSales.set(s.agent_id, { count: cur.count + 1, volume: cur.volume + s.sale_price_czk });
  }
  const agentById = new Map(agents.map((a) => [a.id, a.name]));
  const topAgents = [...agentSales.entries()]
    .map(([id, v]) => ({ name: agentById.get(id) ?? "—", sales: v.count, volume: v.volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const funnelData = getLeadFunnel();
  const audit = auditMissingRenovationData();
  void audit;

  // Lead sources (this year)
  const yearClients = getNewClients(quarterNow(), yearNow());
  void yearClients;
  const sourceMap = new Map<string, number>();
  const { sources } = loadAll();
  const srcById = new Map(sources.map((s) => [s.id, s.name]));
  for (const l of leads) {
    const n = srcById.get(l.source_id) ?? "—";
    sourceMap.set(n, (sourceMap.get(n) ?? 0) + 1);
  }
  const leadSources = [...sourceMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    today: TODAY_ISO,
    totals: {
      properties: properties.length,
      active, reserved, sold,
      leads: leads.length,
      clients: clients.length,
      agents: agents.length,
      missingReno,
    },
    thisMonth: {
      label: mr.periodLabel ?? "",
      newLeads: mr.newLeads,
      nSales: mr.nSales,
      volume: mr.volume,
      commission: mr.commission,
    },
    trend,
    topAgents,
    funnel: funnelData.stages,
    conversionRate: funnelData.conversionRate,
    leadSources,
  };
}

function quarterNow(): "Q1" | "Q2" | "Q3" | "Q4" {
  const m = Number(TODAY_ISO.split("-")[1]);
  return (["Q1", "Q2", "Q3", "Q4"][Math.floor((m - 1) / 3)]) as "Q1" | "Q2" | "Q3" | "Q4";
}
function yearNow() {
  return Number(TODAY_ISO.split("-")[0]);
}

const CZ_MONTHS = ["", "led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];
function build6mTrend() {
  const { leads, sales } = loadAll();
  const [ty, tm] = TODAY_ISO.split("-").map(Number);
  const out: { month: string; leads: number; sales: number; iso: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    let y = ty, m = tm - i;
    while (m <= 0) { m += 12; y -= 1; }
    out.push({ month: `${CZ_MONTHS[m]}`, iso: `${y}-${String(m).padStart(2, "0")}`, leads: 0, sales: 0 });
  }
  const idx = new Map(out.map((o, i) => [o.iso, i]));
  for (const l of leads) {
    const i = idx.get(l.created_at.slice(0, 7));
    if (i !== undefined) out[i].leads++;
  }
  for (const s of sales) {
    const i = idx.get(s.closed_at.slice(0, 7));
    if (i !== undefined) out[i].sales++;
  }
  return out.map(({ month, leads, sales }) => ({ month, leads, sales }));
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CountUp } from "@/components/CountUp";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import { useAuth } from "@/lib/auth";
import { czCurrency, czCompactCurrency, czDate } from "@/lib/format";
import type { DashboardData } from "@/lib/dashboard";
import {
  Building2, Users, TrendingUp, Wallet, AlertTriangle, ArrowRight,
  MessageSquare, CalendarDays,
} from "lucide-react";

type CalEvent = { id: string; title: string; date: string; startTime: string; source: string };

export function DashboardView({ data }: { data: DashboardData }) {
  const { user } = useAuth();
  const firstName = (user ?? "").trim().split(/\s+/)[0] || "";
  const [events, setEvents] = useState<CalEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/calendar", { headers: { "x-user-id": encodeURIComponent(user) } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.events) return;
        const upcoming = (d.events as CalEvent[])
          .filter((e) => e.date >= data.today)
          .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
          .slice(0, 5);
        setEvents(upcoming);
      })
      .catch(() => {});
  }, [user, data.today]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="border-b border-border bg-bg/80 px-8 py-7 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-faint">
            {czDate(data.today)}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-text">
            {firstName ? `Dobrý den, ${firstName}.` : "Přehled"}
          </h1>
          <p className="mt-2 text-[14px] text-text-muted">
            Rychlý pohled na to, jak na tom firma je. Detaily zjistíte v chatu.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi icon={Building2} label="Aktivní nabídky" value={data.totals.active}
            sub={`${data.totals.properties} celkem · ${data.totals.reserved} rez.`} />
          <Kpi icon={TrendingUp} label="Prodeje · měsíc" value={data.thisMonth.nSales}
            sub={data.thisMonth.label} />
          <Kpi icon={Wallet} label="Objem · měsíc" value={data.thisMonth.volume} currency
            sub={`provize ${czCurrency(data.thisMonth.commission)}`} />
          <Kpi icon={Users} label="Leady celkem" value={data.totals.leads}
            sub={`konverze ${data.conversionRate} %`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <p className="eyebrow">Posledních 6 měsíců</p>
              <CardTitle className="mt-1">Leady &amp; prodeje</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ left: -10, right: 12, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" name="Leady" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="sales" name="Prodeje" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="eyebrow">Žebříček</p>
              <CardTitle className="mt-1">Top makléři dle objemu</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topAgents} layout="vertical" margin={{ left: 30, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v) => czCurrency(Number(v))} />
                    <Bar dataKey="volume" name="Objem" radius={[0, 3, 3, 0]}>
                      {data.topAgents.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Bottom row: audit alert + upcoming + quick actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Audit */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-orange" />
                <CardTitle>Vyžaduje pozornost</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-text">
                  <CountUp value={data.totals.missingReno} />
                </span>
                <span className="text-[13px] text-text-muted">nemovitostí bez dat o rekonstrukci</span>
              </div>
              <Link
                href={"/?q=" + encodeURIComponent("Najdi nemovitosti bez dat o rekonstrukci a připrav seznam k doplnění")}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
              >
                Otevřít audit v chatu <ArrowRight className="size-3" />
              </Link>
            </CardBody>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-accent" />
                <CardTitle>Nadcházející</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {events.length === 0 ? (
                <p className="px-5 py-4 text-[13px] text-text-muted">Žádné nadcházející události.</p>
              ) : (
                <ul>
                  {events.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 border-b border-border px-5 py-2.5 last:border-b-0">
                      <span className="font-mono text-[11px] tabular-nums text-accent w-12 shrink-0">{e.startTime}</span>
                      <span className="truncate text-[13px] text-text">{e.title}</span>
                      {e.source === "agent" && <Badge tone="info" className="ml-auto">agent</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-accent" />
                <CardTitle>Rychlé akce</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-1.5">
              {QUICK.map((q) => (
                <Link
                  key={q.label}
                  href={"/?q=" + encodeURIComponent(q.prompt)}
                  className="group flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] text-text-2 transition-colors hover:border-border-bright hover:bg-surface-2"
                >
                  <span className="flex-1">{q.label}</span>
                  <ArrowRight className="size-3 text-text-faint group-hover:text-accent" />
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

const QUICK = [
  { label: "Týdenní report pro vedení", prompt: "Připrav týdenní report pro vedení s 3 slidy." },
  { label: "Klienti za Q1 dle zdroje", prompt: "Jaké nové klienty máme za 1. kvartál 2026? Znázorni graficky." },
  { label: "Ranní briefing Holešovice", prompt: "Co je nového na trhu v Praze-Holešovicích?" },
];

function Kpi({
  icon: Icon, label, value, sub, currency,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  currency?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 lift">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-text-faint" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-faint">{label}</p>
      </div>
      <p className="mt-2 text-[21px] font-semibold leading-none tracking-[-0.02em] text-text whitespace-nowrap md:text-[26px]">
        <CountUp value={value} format={currency ? (n) => czCompactCurrency(n) : undefined} />
      </p>
      {sub && <p className="mt-2 text-[11px] text-text-faint">{sub}</p>}
    </div>
  );
}

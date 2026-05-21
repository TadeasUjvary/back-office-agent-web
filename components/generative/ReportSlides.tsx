"use client";
import { useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import type { WeeklyReport } from "@/lib/queries";
import { czCurrency, czNumber, czShortDate } from "@/lib/format";

type Props = { data: WeeklyReport & { includeSlides: boolean } };

export function ReportSlides({ data }: Props) {
  return (
    <div className="space-y-4">
      <ReportCard data={data} />
      {data.includeSlides && <SlideDeck data={data} />}
    </div>
  );
}

function Kpi({ label, value, sub, big }: { label: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div className="border-l border-hairline pl-4">
      <p className="eyebrow">{label}</p>
      <p
        className={`display mt-1 leading-tight tracking-tight text-ink ${
          big ? "text-[32px]" : "text-[22px]"
        }`}
      >
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-ink-faint mt-0.5">{sub}</p>}
    </div>
  );
}

function ReportCard({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow">Týdenní report pro vedení</p>
            <CardTitle className="mt-1">{czShortDate(data.weekStart)} – {czShortDate(data.weekEnd)}</CardTitle>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            #{data.weekEnd.replace(/-/g, "")}
          </span>
        </div>
      </CardHeader>
      <CardBody className="grid grid-cols-2 gap-y-5 md:grid-cols-4">
        <Kpi label="Nové leady" value={czNumber(data.newLeads)} />
        <Kpi label="Prodeje" value={String(data.nSales)} sub={`top: ${data.topAgent.name}`} />
        <Kpi label="Objem" value={czCurrency(data.volume)} />
        <Kpi label="Provize" value={czCurrency(data.commission)} />
        <Kpi label="Noví klienti" value={String(data.newClients)} />
        <Kpi label="Aktivní nabídky" value={String(data.active)} sub={`rez. ${data.reserved}`} />
        <Kpi label="Chybí rekonstrukce" value={String(data.missing)} sub="audit" />
        <Kpi
          label="Top zdroj"
          value={data.leadsBySource[0]?.name ?? "—"}
          sub={data.leadsBySource[0] ? `${data.leadsBySource[0].count} leadů` : ""}
        />
      </CardBody>
    </Card>
  );
}

function SlideDeck({ data }: Props) {
  const [i, setI] = useState(0);
  const slides = [
    <Slide1 key="1" data={data} />,
    <Slide2 key="2" data={data} />,
    <Slide3 key="3" data={data} />,
  ];
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow">3-slide deck · pro vedení</p>
            <CardTitle className="mt-1">Prezentace</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tabular-nums text-ink-faint">
              {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
            <Button variant="secondary" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="p-1.5">
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button variant="secondary" onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))} disabled={i === slides.length - 1} className="p-1.5">
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="bg-paper-deep p-0">
        <div className="min-h-[420px] bg-card p-10">
          {slides[i]}
        </div>
      </CardBody>
    </Card>
  );
}

function Slide1({ data }: Props) {
  return (
    <div className="space-y-6">
      <p className="eyebrow">01 · Shrnutí týdne</p>
      <h2 className="font-display text-[44px] leading-[1.02] tracking-tight">
        {czShortDate(data.weekStart)} <br />
        <em className="not-italic text-copper">{czShortDate(data.weekEnd)}</em>
      </h2>
      <div className="hairline" />
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <Kpi label="Nové leady" value={czNumber(data.newLeads)} big />
        <Kpi label="Prodeje" value={String(data.nSales)} big />
        <Kpi label="Objem" value={czCurrency(data.volume)} />
        <Kpi label="Provize" value={czCurrency(data.commission)} />
      </div>
      <p className="max-w-xl text-[14px] leading-relaxed text-ink-muted">
        Top makléř týdne: <span className="text-ink">{data.topAgent.name}</span> ({data.topAgent.count} prodejů).
        Pipeline obsahuje <span className="text-ink">{data.pipeline.find((p) => p.status === "kvalifikován")?.count ?? 0}</span> kvalifikovaných leadů.
      </p>
    </div>
  );
}

function Slide2({ data }: Props) {
  const top = data.leadsBySource.slice(0, 6);
  return (
    <div className="space-y-6">
      <p className="eyebrow">02 · Akvizice leadů</p>
      <h2 className="font-display text-[36px] leading-[1.02] tracking-tight">
        Kanály, které <em className="not-italic text-copper">tahaly</em>
      </h2>
      <div className="hairline" />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} margin={{ left: -10, right: 10, top: 6, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 10 }} height={60} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#FBF8F1", border: "1px solid #C9BFAA", fontFamily: "var(--font-mono)", fontSize: 11 }} />
            <Bar dataKey="count" name="Leady">
              {top.map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Slide3({ data }: Props) {
  const pipe = data.pipeline;
  return (
    <div className="space-y-6">
      <p className="eyebrow">03 · Cíle &amp; rizika</p>
      <h2 className="font-display text-[36px] leading-[1.02] tracking-tight">
        Pipeline &amp; <em className="not-italic text-copper">follow-up</em>
      </h2>
      <div className="hairline" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pipe} dataKey="count" nameKey="status" outerRadius={80} stroke="#FBF8F1" strokeWidth={2} label>
                {pipe.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ background: "#FBF8F1", border: "1px solid #C9BFAA", fontFamily: "var(--font-mono)", fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="eyebrow mb-3">Priority na příští týden</p>
          <ul className="space-y-3 text-[14px] leading-relaxed text-ink-muted">
            <li className="border-l border-copper pl-4">
              Doplnit <span className="text-ink">{data.missing}</span> nemovitostí bez dat o rekonstrukci.
            </li>
            <li className="border-l border-hairline-strong pl-4">
              Posunout <span className="text-ink">{pipe.find((p) => p.status === "kvalifikován")?.count ?? 0}</span> kvalifikovaných leadů k prohlídce.
            </li>
            <li className="border-l border-hairline-strong pl-4">
              Aktivně nabízíme <span className="text-ink">{data.active}</span> nemovitostí (rezervováno {data.reserved}).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

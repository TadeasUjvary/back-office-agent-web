"use client";
import { useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CHART_COLORS, CHART_GRID } from "@/lib/chart-colors";
import type { WeeklyReport, ReportSlide } from "@/lib/queries";
import { czCurrency, czNumber, czShortDate } from "@/lib/format";

type Props = { data: WeeklyReport };

export function ReportSlides({ data }: Props) {
  return (
    <div className="space-y-4">
      <ReportCard data={data} />
      {data.includeSlides && data.slides && data.slides.length > 0 && (
        <SlideDeck slides={data.slides} periodLabel={data.periodLabel ?? `${czShortDate(data.weekStart)} – ${czShortDate(data.weekEnd)}`} />
      )}
    </div>
  );
}

function Kpi({ label, value, sub, big }: { label: string; value: string; sub?: string; big?: boolean }) {
  // Auto-scale font for long values (e.g. "53 637 000 Kč") so they fit in narrow columns
  const valueLen = value.length;
  const size = big
    ? valueLen > 14
      ? "text-[18px]"
      : valueLen > 9
        ? "text-[22px]"
        : "text-[28px]"
    : valueLen > 12
      ? "text-[15px]"
      : "text-[18px]";
  return (
    <div className="min-w-0 border-l border-border pl-4">
      <p className="text-[10px] uppercase tracking-wider text-text-faint">{label}</p>
      <p
        className={`mt-1.5 font-semibold leading-[1.05] tracking-[-0.02em] text-text whitespace-nowrap ${size}`}
      >
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-text-faint mt-1">{sub}</p>}
    </div>
  );
}

function ReportCard({ data }: Props) {
  const periodLabel = data.periodLabel ?? `${czShortDate(data.weekStart)} – ${czShortDate(data.weekEnd)}`;
  const periodWord =
    data.period === "day" ? "Denní" :
    data.period === "month" ? "Měsíční" :
    data.period === "quarter" ? "Kvartální" :
    "Týdenní";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow">{periodWord} report pro vedení</p>
            <CardTitle className="mt-1">{periodLabel}</CardTitle>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">
            #{data.weekEnd.replace(/-/g, "")}
          </span>
        </div>
      </CardHeader>
      <CardBody className="grid grid-cols-2 gap-y-5 md:grid-cols-4">
        <Kpi label="Nové leady" value={czNumber(data.newLeads)} />
        <Kpi label="Prodeje" value={String(data.nSales)} sub={data.topAgent.count ? `top: ${data.topAgent.name}` : undefined} />
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

function SlideDeck({ slides, periodLabel }: { slides: ReportSlide[]; periodLabel: string }) {
  const [i, setI] = useState(0);
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow">{slides.length}-slide deck · pro vedení</p>
            <CardTitle className="mt-1">Prezentace</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tabular-nums text-text-faint">
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
      <CardBody className="bg-bg-2 p-0">
        <div className="min-h-[440px] bg-surface p-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent-bright">
            {String(i + 1).padStart(2, "0")} · {periodLabel}
          </p>
          <div className="mt-4">
            <SlideRenderer slide={slides[i]} />
          </div>
        </div>
        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-bg-2 py-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`size-1.5 rounded-full transition-colors ${idx === i ? "bg-accent-bright" : "bg-border-strong hover:bg-text-dim"}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function SlideRenderer({ slide }: { slide: ReportSlide }) {
  switch (slide.kind) {
    case "kpi-grid": {
      const n = slide.kpis.length;
      // 4 KPIs → 2×2 grid (more breathing room); fewer → 1 row
      const gridCls =
        n >= 4
          ? "grid-cols-2 sm:grid-cols-4"
          : n === 3
            ? "grid-cols-3"
            : n === 2
              ? "grid-cols-2"
              : "grid-cols-1";
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text">
              {slide.heading}
            </h2>
            {slide.subheading && <p className="mt-1.5 text-[13px] text-text-muted">{slide.subheading}</p>}
          </div>
          <div className={`grid ${gridCls} gap-x-8 gap-y-7`}>
            {slide.kpis.map((k, idx) => (
              <Kpi key={idx} label={k.label} value={k.value} sub={k.sub} big />
            ))}
          </div>
        </div>
      );
    }
    case "bar-chart":
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-text">
              {slide.heading}
            </h2>
            {slide.subheading && <p className="mt-1 text-[13px] text-text-muted">{slide.subheading}</p>}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slide.data} margin={{ left: -5, right: 16, top: 8, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="label" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 10 }} height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {slide.data.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case "pie-chart":
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-text">
              {slide.heading}
            </h2>
            {slide.subheading && <p className="mt-1 text-[13px] text-text-muted">{slide.subheading}</p>}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slide.data}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={120}
                  label={(e: { label?: string; value?: number }) => `${e.label} · ${e.value}`}
                  labelLine={false}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {slide.data.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case "table":
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-text">
              {slide.heading}
            </h2>
            {slide.subheading && <p className="mt-1 text-[13px] text-text-muted">{slide.subheading}</p>}
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="min-w-full text-[12px]">
              <thead className="bg-surface-2">
                <tr>
                  {slide.columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-faint">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slide.rows.map((r, ri) => (
                  <tr key={ri} className="border-t border-border">
                    {r.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-text-2 whitespace-nowrap">{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "text":
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text">
              {slide.heading}
            </h2>
            {slide.subheading && <p className="mt-1 text-[13px] text-text-muted">{slide.subheading}</p>}
          </div>
          {slide.body && <p className="text-[14px] leading-relaxed text-text-2">{slide.body}</p>}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-2 pt-2">
              {slide.bullets.map((b, idx) => (
                <li key={idx} className="flex gap-3 border-l border-accent/40 pl-4 text-[14px] text-text-2">
                  <span className="font-mono text-[10px] text-accent-bright">{String(idx + 1).padStart(2, "0")}</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
  }
  // exhaustive
  const _exhaustive: never = slide;
  return null;
}

/** Single Badge import kept for sidebar regression — unused in this file but kept to avoid tree-shake breakage. */
const _badgeRef = Badge;
void _badgeRef;

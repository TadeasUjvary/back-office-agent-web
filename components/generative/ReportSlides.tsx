"use client";
import { useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, ChevronRight, Presentation, FileText } from "lucide-react";
import type { WeeklyReport } from "@/lib/queries";
import { czCurrency, czNumber, czShortDate } from "@/lib/format";

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

type Props = { data: WeeklyReport & { includeSlides: boolean } };

export function ReportSlides({ data }: Props) {
  return (
    <div className="space-y-3">
      <ReportCard data={data} />
      {data.includeSlides && <SlideDeck data={data} />}
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function ReportCard({ data }: Props) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <FileText className="size-4 text-zinc-700" />
        <CardTitle>Týdenní report pro vedení</CardTitle>
        <Badge tone="default" className="ml-auto">
          {czShortDate(data.weekStart)} – {czShortDate(data.weekEnd)}
        </Badge>
      </CardHeader>
      <CardBody className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI label="Nové leady" value={czNumber(data.newLeads)} />
        <KPI label="Prodeje" value={String(data.nSales)} sub={`top makléř: ${data.topAgent.name}`} />
        <KPI label="Objem" value={czCurrency(data.volume)} />
        <KPI label="Provize" value={czCurrency(data.commission)} />
        <KPI label="Noví klienti" value={String(data.newClients)} />
        <KPI label="Aktivní nabídky" value={String(data.active)} sub={`rezervováno: ${data.reserved}`} />
        <KPI label="Chybí rekonstrukce" value={String(data.missing)} sub="audit k doplnění" />
        <KPI
          label="Top zdroj leadů"
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
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Presentation className="size-4 text-indigo-600" />
        <CardTitle>3-slide prezentace pro vedení</CardTitle>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">{i + 1} / {slides.length}</span>
          <Button variant="secondary" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))} disabled={i === slides.length - 1}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="relative min-h-[360px] rounded-2xl bg-gradient-to-br from-zinc-50 to-indigo-50/40 p-6">
          {slides[i]}
        </div>
      </CardBody>
    </Card>
  );
}

function Slide1({ data }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-indigo-700">Slide 1 · Shrnutí týdne</p>
        <h2 className="mt-1 text-3xl font-bold text-zinc-900">
          {czShortDate(data.weekStart)} – {czShortDate(data.weekEnd)}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI label="Nové leady" value={czNumber(data.newLeads)} />
        <KPI label="Prodeje" value={String(data.nSales)} />
        <KPI label="Objem" value={czCurrency(data.volume)} />
        <KPI label="Provize" value={czCurrency(data.commission)} />
      </div>
      <p className="text-sm text-zinc-700">
        Top makléř týdne: <b>{data.topAgent.name}</b> ({data.topAgent.count} prodejů).
        Pipeline obsahuje <b>{data.pipeline.find((p) => p.status === "kvalifikován")?.count ?? 0}</b> kvalifikovaných leadů.
      </p>
    </div>
  );
}

function Slide2({ data }: Props) {
  const top = data.leadsBySource.slice(0, 6);
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-indigo-700">Slide 2 · Akvizice leadů</p>
      <h2 className="text-2xl font-bold text-zinc-900">Kanály, které týden tahaly</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} margin={{ left: -10, right: 10, top: 6, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" tick={{ fontSize: 11 }} height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" name="Leady">
              {top.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
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
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-indigo-700">Slide 3 · Cíle a rizika</p>
      <h2 className="text-2xl font-bold text-zinc-900">Pipeline & follow-up</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pipe} dataKey="count" nameKey="status" outerRadius={80} label>
                {pipe.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-medium text-zinc-900">Priority na příští týden:</p>
          <ul className="list-disc space-y-1 pl-5 text-zinc-700">
            <li>Doplnit <b>{data.missing}</b> nemovitostí bez dat o rekonstrukci.</li>
            <li>Posunout <b>{pipe.find((p) => p.status === "kvalifikován")?.count ?? 0}</b> kvalifikovaných leadů k prohlídce.</li>
            <li>Aktivně nabízíme <b>{data.active}</b> nemovitostí (rezervováno {data.reserved}).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

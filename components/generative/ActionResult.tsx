"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2, Mail, FileSpreadsheet, MessageSquarePlus, AlertTriangle, BellRing, ExternalLink, Globe,
} from "lucide-react";
import { czCurrency } from "@/lib/format";

type Icon = React.ComponentType<{ className?: string }>;

function ConfirmCard({
  icon: Icon, title, subtitle, rows, accent = "emerald",
}: {
  icon: Icon;
  title: string;
  subtitle?: string;
  rows: { label: string; value: React.ReactNode }[];
  accent?: "emerald" | "indigo" | "amber" | "rose";
}) {
  const accentBg = {
    emerald: "bg-emerald-100 text-emerald-700",
    indigo: "bg-indigo-100 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  }[accent];
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <div className={`flex size-8 items-center justify-center rounded-lg ${accentBg}`}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1">
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        <Badge tone="success">
          <CheckCircle2 className="mr-1 size-3" /> Odesláno
        </Badge>
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          {rows.map((r, i) => (
            <div key={i} className="contents">
              <dt className="text-zinc-500">{r.label}</dt>
              <dd className="text-zinc-900 break-words">{r.value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}

export function SendEmailResult({ data }: { data: ReturnType<typeof import("@/lib/actions").mockSendEmail> }) {
  return (
    <ConfirmCard
      icon={Mail}
      accent="rose"
      title="E-mail odeslán přes Gmail"
      subtitle={`Message ID: ${data.messageId}`}
      rows={[
        { label: "Komu", value: data.to },
        ...(data.cc?.length ? [{ label: "Kopie", value: data.cc.join(", ") }] : []),
        { label: "Předmět", value: data.subject },
        { label: "Náhled", value: <span className="text-zinc-700 italic">{data.bodyPreview}…</span> },
        ...(data.attachments?.length
          ? [{ label: "Přílohy", value: data.attachments.join(", ") }]
          : []),
      ]}
    />
  );
}

export function CRMNoteResult({ data }: { data: ReturnType<typeof import("@/lib/actions").mockLogCRMNote> }) {
  return (
    <ConfirmCard
      icon={MessageSquarePlus}
      accent="indigo"
      title="Poznámka zapsaná do CRM"
      subtitle={`Note ID: ${data.noteId} · ${data.tag}`}
      rows={[
        { label: "Záznam", value: data.entityLabel },
        { label: "Text", value: data.note },
        { label: "Autor", value: data.by },
      ]}
    />
  );
}

export function UrgeAgentResult({ data }: { data: ReturnType<typeof import("@/lib/actions").mockUrgeAgent> }) {
  if (!data.sent) {
    return (
      <Card>
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          <CardTitle>Urgenci nelze odeslat</CardTitle>
        </CardHeader>
        <CardBody className="text-sm text-zinc-700">{data.reason}</CardBody>
      </Card>
    );
  }
  return (
    <ConfirmCard
      icon={BellRing}
      accent="amber"
      title={`Urgence odeslána — ${data.agentName}`}
      subtitle={`Message ID: ${data.messageId}`}
      rows={[
        { label: "Komu", value: data.to },
        { label: "Předmět", value: data.subject },
        ...(data.itemCount !== undefined ? [{ label: "Počet položek", value: String(data.itemCount) }] : []),
        { label: "Termín", value: data.deadline },
      ]}
    />
  );
}

export function ExportSheetResult({ data }: { data: ReturnType<typeof import("@/lib/actions").mockExportToSheet> }) {
  return (
    <ConfirmCard
      icon={FileSpreadsheet}
      accent="emerald"
      title={`Tabulka vytvořena v Google Sheets`}
      subtitle={`Sheet ID: ${data.sheetId}`}
      rows={[
        { label: "Název", value: data.title },
        { label: "Entita", value: data.entity },
        { label: "Řádků", value: String(data.rowCount) },
        {
          label: "Odkaz",
          value: (
            <a href={data.url} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
              Otevřít v Sheets <ExternalLink className="size-3" />
            </a>
          ),
        },
      ]}
    />
  );
}

export function FetchUrlResult({ data }: { data: Awaited<ReturnType<typeof import("@/lib/web").fetchWebUrl>> }) {
  if (!data.ok) {
    return (
      <Card>
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-rose-600" />
          <CardTitle>URL nelze načíst</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1 text-sm">
          <p className="text-zinc-700">{data.error}</p>
          <p className="text-xs text-zinc-500 break-all">{data.url}</p>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Globe className="size-4 text-indigo-600" />
        <CardTitle>{data.title ?? data.finalUrl}</CardTitle>
        <Badge tone="info" className="ml-auto">HTTP {data.status}</Badge>
      </CardHeader>
      <CardBody className="space-y-2">
        <a href={data.finalUrl} className="block break-all text-xs text-indigo-600 hover:underline">
          {data.finalUrl}
        </a>
        <p className="text-xs text-zinc-500">
          {data.contentType} {data.truncated && "· obsah zkrácen"}
        </p>
        <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
          {data.textPreview}
        </pre>
      </CardBody>
    </Card>
  );
}

export function ComparePeriodsResult({
  data,
}: {
  data: ReturnType<typeof import("@/lib/queries").comparePeriods>;
}) {
  const isCurrency = data.metric === "salesVolume" || data.metric === "commission";
  const fmt = (n: number) => (isCurrency ? czCurrency(n) : n.toLocaleString("cs-CZ"));
  const directionTone =
    data.diff > 0 ? "success" : data.diff < 0 ? "danger" : "default";
  const arrow = data.diff > 0 ? "▲" : data.diff < 0 ? "▼" : "→";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Srovnání období — {data.metric}</CardTitle>
        <Badge tone={directionTone} className="mt-2">
          {arrow} {data.direction} {data.pct !== null ? `${data.pct > 0 ? "+" : ""}${data.pct} %` : ""}
        </Badge>
      </CardHeader>
      <CardBody className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{data.periodA.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{fmt(data.periodA.value)}</p>
          <p className="mt-1 text-xs text-zinc-500">{data.periodA.from} → {data.periodA.toExcl}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{data.periodB.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{fmt(data.periodB.value)}</p>
          <p className="mt-1 text-xs text-zinc-500">{data.periodB.from} → {data.periodB.toExcl}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
          Absolutní rozdíl: <b className="tabular-nums">{fmt(Math.abs(data.diff))}</b> {data.direction}.
        </div>
      </CardBody>
    </Card>
  );
}

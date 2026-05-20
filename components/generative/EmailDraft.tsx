"use client";
import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Mail, CheckCircle2, Pencil } from "lucide-react";
import type { ViewingSlotsResult } from "@/lib/queries";
import { czCurrency } from "@/lib/format";

export function EmailDraft({ data }: { data: ViewingSlotsResult }) {
  const [sent, setSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(data.emailDraft.subject);
  const [body, setBody] = useState(data.emailDraft.body);

  return (
    <div className="space-y-3">
      {/* Calendar slot suggestions */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Calendar className="size-4 text-indigo-600" />
          <CardTitle>Doporučené termíny prohlídky</CardTitle>
        </CardHeader>
        <CardBody>
          {data.property && (
            <p className="mb-3 text-xs text-zinc-600">
              <b>{data.property.ref_code}</b> · {data.property.type} · {data.property.address}
              {" · "}{czCurrency(data.property.price_czk)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {data.suggestions.map((s) => (
              <span
                key={s.date + s.time}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900"
              >
                <b>{s.label}</b> v {s.time}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Délka prohlídky {data.durationMin} min. Slotů celkem k dispozici:{" "}
            {data.byDay.reduce((a, d) => a + d.times.length, 0)} ve {data.byDay.length} dnech.
          </p>
        </CardBody>
      </Card>

      {/* Email draft */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Mail className="size-4 text-zinc-700" />
          <CardTitle>Návrh e-mailu</CardTitle>
          {sent && (
            <Badge tone="success" className="ml-auto">
              <CheckCircle2 className="mr-1 size-3" />
              Odesláno
            </Badge>
          )}
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
            <span className="text-zinc-500">Komu:</span>
            <span className="font-medium">{data.emailDraft.to}</span>
            <span className="text-zinc-500">Předmět:</span>
            {editing ? (
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
              />
            ) : (
              <span className="font-medium">{subject}</span>
            )}
          </div>
          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-zinc-300 p-3 font-mono text-sm"
            />
          ) : (
            <pre className="whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800">
              {body}
            </pre>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              disabled={sent}
              onClick={() => { setSent(true); setEditing(false); }}
            >
              {sent ? "Odesláno" : "Odeslat"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEditing((e) => !e)}
              disabled={sent}
            >
              <Pencil className="size-3.5" /> {editing ? "Hotovo" : "Upravit"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

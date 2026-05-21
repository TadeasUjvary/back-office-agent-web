"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { czDate, czCurrency } from "@/lib/format";

type BriefingListing = {
  id: string;
  portal: string;
  title: string;
  district: string;
  type: string;
  area_m2: number;
  price_czk: number;
  url: string;
  published: string;
};
type Briefing = {
  id: string;
  date: string;
  district: string;
  listings: BriefingListing[];
  generated_by: "manual" | "cron" | "seed";
  created_at: string;
};

export default function BriefingsPage() {
  const { user, hydrated } = useAuth();
  const searchParams = useSearchParams();
  const district = searchParams.get("district") ?? "Praha-Holešovice";
  const requestedDate = searchParams.get("date");

  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(requestedDate);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/briefings?district=${encodeURIComponent(district)}`, {
        headers: { "x-user-id": encodeURIComponent(user) },
      });
      const data = await res.json();
      const rows = (data.briefings ?? []) as Briefing[];
      setBriefings(rows);
      if (!selectedDate && rows.length > 0) setSelectedDate(rows[0].date);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user, district, selectedDate]);

  useEffect(() => {
    if (hydrated && user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, district]);

  const generateNext = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/briefings/advance", {
        method: "POST",
        headers: { "x-user-id": encodeURIComponent(user) },
      });
      const data = await res.json();
      if (data.briefing) {
        setSelectedDate(data.briefing.date);
        await refresh();
      }
    } catch {
    } finally {
      setGenerating(false);
    }
  };

  const selected = selectedDate
    ? briefings.find((b) => b.date === selectedDate)
    : briefings[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow="Co se nového objevilo na trhu"
        title="Ranní briefingy"
        description={
          <>
            Každé ráno v 07:30 se podívám, co přibylo k prodeji v <span className="font-mono text-text">{district}</span>.
            Nové nabídky proletí přes Sreality, Bezrealitky a iDNES — sumáře najdete níže.
          </>
        }
        right={
          <Button onClick={generateNext} disabled={generating || !user}>
            {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Vygenerovat další den
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Day list */}
          <nav>
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">{briefings.length} dnů v DB</p>
              <button
                onClick={refresh}
                disabled={loading}
                className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface hover:text-text"
                title="Obnovit"
              >
                <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loading && briefings.length === 0 ? (
              <p className="text-[12px] text-text-faint">načítám…</p>
            ) : briefings.length === 0 ? (
              <p className="text-[12px] text-text-faint">
                Žádné briefingy. Klikněte „Vygenerovat další den".
              </p>
            ) : (
              <ol className="space-y-1">
                {briefings.map((b, idx) => {
                  const isSel = selected?.id === b.id;
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => setSelectedDate(b.date)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors ${
                          isSel
                            ? "border border-border-strong bg-surface text-text"
                            : "border border-transparent text-text-muted hover:bg-surface/60 hover:text-text"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-[10px] tabular-nums text-text-dim w-6">
                            {String(briefings.length - idx).padStart(2, "0")}
                          </span>
                          <span className="text-[13px]">{czDate(b.date)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          {b.generated_by === "manual" && (
                            <Badge tone="info" className="text-[9px]">nový</Badge>
                          )}
                          <span className={`font-mono text-[13px] tabular-nums ${isSel ? "text-accent-bright" : "text-text-faint"}`}>
                            {b.listings.length}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </nav>

          {/* Selected day detail */}
          {selected ? (
            <Card>
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="eyebrow">Briefing</p>
                    <CardTitle className="mt-1">{czDate(selected.date)}</CardTitle>
                  </div>
                  <Badge tone={selected.generated_by === "manual" ? "info" : "default"}>
                    {selected.generated_by === "manual" ? "vygenerováno tlačítkem" : selected.generated_by}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[10px] text-text-faint">
                  Sreality.cz · Bezrealitky.cz · Reality.iDNES.cz
                </p>
              </CardHeader>
              <CardBody>
                {selected.listings.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    Žádné nové nabídky v lokalitě {district} tento den.
                  </p>
                ) : (
                  <>
                    <div className="mb-5 grid grid-cols-2 gap-6 border-b border-border pb-5">
                      <div>
                        <p className="eyebrow">Nových nabídek</p>
                        <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-text">
                          {selected.listings.length}
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow">Průměrná cena</p>
                        <p className="mt-1 text-[20px] font-semibold leading-none tracking-[-0.02em] text-text whitespace-nowrap">
                          {czCurrency(
                            Math.round(
                              selected.listings.reduce((a, l) => a + l.price_czk, 0)
                                / selected.listings.length,
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {selected.listings.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-start gap-3 rounded-lg border border-border bg-surface-2/60 p-3"
                        >
                          <Badge>{l.portal}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[13px] font-medium text-text">{l.title}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-text-faint">
                              {l.published} ·{" "}
                              <a href={l.url} className="text-accent-bright hover:underline">
                                otevřít ↗
                              </a>
                            </p>
                          </div>
                          <span className="font-mono text-[13px] tabular-nums text-text whitespace-nowrap">
                            {czCurrency(l.price_czk)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="text-sm text-text-muted">
                {loading ? "Načítám…" : 'Žádné briefingy. Klikněte „Vygenerovat další den".'}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

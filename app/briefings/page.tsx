import { listBriefings } from "@/lib/queries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { czDate, czCurrency } from "@/lib/format";

type Search = Promise<{ date?: string; district?: string }>;

export default async function BriefingsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const district = params.district ?? "Praha-Holešovice";
  const briefings = listBriefings(district);
  const selected = params.date
    ? briefings.find((b) => b.date === params.date)
    : briefings[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow="Cron / monitoring"
        title="Ranní briefingy"
        description={
          <>
            Lokalita <span className="font-mono text-text">{district}</span> · denně v{" "}
            <span className="font-mono">07:30</span> · simulace cron jobu nad mockovaným feedem portálů.
          </>
        }
      />

      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Day list */}
          <nav>
            <p className="eyebrow mb-3">Posledních {briefings.length} dnů</p>
            <ol className="space-y-1">
              {briefings.map((b, idx) => {
                const isSel = selected?.date === b.date;
                return (
                  <li key={b.date}>
                    <a
                      href={`/briefings?date=${b.date}&district=${encodeURIComponent(district)}`}
                      className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
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
                      <span className={`font-mono text-[13px] tabular-nums ${isSel ? "text-accent-bright" : "text-text-faint"}`}>
                        {b.listings.length}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Selected day detail */}
          {selected ? (
            <Card>
              <CardHeader>
                <p className="eyebrow">Briefing</p>
                <CardTitle className="mt-1">{czDate(selected.date)}</CardTitle>
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
                        <p className="mt-1 text-[20px] font-semibold leading-none tracking-[-0.02em] text-text">
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
            <Card><CardBody className="text-sm text-text-muted">Žádné briefingy.</CardBody></Card>
          )}
        </div>
      </div>
    </div>
  );
}

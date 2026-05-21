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
        num="02"
        eyebrow="Cron / monitoring"
        title={
          <>
            Ranní <em className="not-italic text-copper">briefingy</em>
          </>
        }
        description={
          <>
            Lokalita <span className="font-mono text-ink">{district}</span> · denně v <span className="font-mono">07:30</span> · simulace cron jobu nad mockovaným feedem realitních portálů.
          </>
        }
      />

      <div className="mx-auto max-w-6xl px-10 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
          {/* Day list */}
          <nav>
            <p className="eyebrow mb-3">Posledních {briefings.length} dnů</p>
            <ol>
              {briefings.map((b, idx) => {
                const isSel = selected?.date === b.date;
                return (
                  <li key={b.date}>
                    <a
                      href={`/briefings?date=${b.date}&district=${encodeURIComponent(district)}`}
                      className={`flex items-baseline justify-between border-b border-hairline py-3 transition-colors ${
                        isSel ? "text-ink" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] tabular-nums text-ink-faint w-6">
                          {String(briefings.length - idx).padStart(2, "0")}
                        </span>
                        <span className="text-[13px] tracking-tight">{czDate(b.date)}</span>
                      </span>
                      <span className={`font-mono text-[14px] tabular-nums ${isSel ? "text-copper" : ""}`}>
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
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  Sreality.cz · Bezrealitky.cz · Reality.iDNES.cz
                </p>
              </CardHeader>
              <CardBody>
                {selected.listings.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Žádné nové nabídky v lokalitě {district} tento den.
                  </p>
                ) : (
                  <>
                    <div className="mb-5 grid grid-cols-2 gap-6 border-b border-hairline pb-5">
                      <div>
                        <p className="eyebrow">Nových nabídek</p>
                        <p className="display mt-1 text-[36px] leading-none tracking-tight">
                          {selected.listings.length}
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow">Průměrná cena</p>
                        <p className="display mt-1 text-[22px] leading-none tracking-tight">
                          {czCurrency(
                            Math.round(
                              selected.listings.reduce((a, l) => a + l.price_czk, 0)
                                / selected.listings.length,
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                    <ul>
                      {selected.listings.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-start gap-4 border-b border-hairline py-4 last:border-b-0"
                        >
                          <Badge>{l.portal}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-[16px] tracking-tight text-ink">
                              {l.title}
                            </p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                              {l.published} ·{" "}
                              <a href={l.url} className="text-copper hover:underline">
                                otevřít ↗
                              </a>
                            </p>
                          </div>
                          <span className="font-mono text-[14px] tabular-nums text-ink whitespace-nowrap">
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
              <CardBody className="text-sm text-ink-muted">Žádné briefingy k zobrazení.</CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

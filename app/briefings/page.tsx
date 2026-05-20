import { listBriefings } from "@/lib/queries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BellRing } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <BellRing className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Ranní briefingy</h1>
            <p className="text-sm text-zinc-600">
              Lokalita <b>{district}</b> · denně v 07:30 · simulace cron jobu
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Day list */}
          <nav className="space-y-2">
            {briefings.map((b) => {
              const isSel = selected?.date === b.date;
              return (
                <a
                  key={b.date}
                  href={`/briefings?date=${b.date}&district=${encodeURIComponent(district)}`}
                  className={`block rounded-xl border p-3 transition-colors ${
                    isSel
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <p className="text-xs text-zinc-500">{czDate(b.date)}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-2xl font-semibold tabular-nums text-zinc-900">
                      {b.listings.length}
                    </span>
                    <span className="text-xs text-zinc-500">nových nabídek</span>
                  </div>
                </a>
              );
            })}
          </nav>

          {/* Selected day detail */}
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Přehled z {czDate(selected.date)}
                </CardTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  Lokalita: {district} · zdroje: Sreality.cz, Bezrealitky.cz, Reality.iDNES.cz
                </p>
              </CardHeader>
              <CardBody>
                {selected.listings.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Žádné nové nabídky v lokalitě {district} tento den.
                  </p>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-zinc-700">
                      Nalezeno <b>{selected.listings.length}</b> nových nabídek.
                      Průměrná cena{" "}
                      <b>
                        {czCurrency(
                          Math.round(
                            selected.listings.reduce((a, l) => a + l.price_czk, 0)
                              / selected.listings.length,
                          ),
                        )}
                      </b>
                      .
                    </p>
                    <ul className="space-y-3">
                      {selected.listings.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3"
                        >
                          <Badge tone="info">{l.portal}</Badge>
                          <div className="flex-1">
                            <p className="font-medium text-zinc-900">{l.title}</p>
                            <p className="text-xs text-zinc-500">
                              Publikováno {l.published} ·{" "}
                              <a
                                href={l.url}
                                className="text-indigo-600 underline-offset-2 hover:underline"
                              >
                                otevřít nabídku
                              </a>
                            </p>
                          </div>
                          <span className="tabular-nums text-sm font-medium text-zinc-900">
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
              <CardBody>Žádné briefingy k zobrazení.</CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

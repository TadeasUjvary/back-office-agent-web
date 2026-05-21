"use client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, AlertTriangle, ExternalLink } from "lucide-react";

type Result = { title: string; link: string; snippet: string; date?: string; position: number };
type Data =
  | { ok: true; query: string; results: Result[]; answerBox: { title?: string; answer?: string; snippet?: string; link?: string } | null; knowledgeGraph: { title?: string; description?: string } | null; engine: string }
  | { ok: false; query: string; error: string; results: Result[] };

export function WebSearchResult({ data }: { data: Data }) {
  if (!data.ok) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-rose/15 text-rose">
              <AlertTriangle className="size-4" />
            </div>
            <div className="flex-1">
              <p className="eyebrow">Vyhledávání na webu</p>
              <CardTitle className="mt-1">Selhalo</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-[13px] text-text-2">{data.error}</p>
          <p className="mt-2 font-mono text-[10px] text-text-faint">Dotaz: {data.query}</p>
        </CardBody>
      </Card>
    );
  }

  const hostname = (url: string) => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan/15 text-cyan">
            <Globe className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow">{data.engine}</p>
            <CardTitle className="mt-1 truncate">„{data.query}"</CardTitle>
          </div>
          <Badge tone="info">{data.results.length} výsledků</Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {data.answerBox?.answer && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <p className="eyebrow text-accent-bright">Answer box</p>
            <p className="mt-1.5 text-[14px] text-text">{data.answerBox.answer}</p>
            {data.answerBox.link && (
              <a
                href={data.answerBox.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-accent-bright hover:underline"
              >
                {hostname(data.answerBox.link)} <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        )}
        {data.knowledgeGraph?.description && (
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="eyebrow">Knowledge graph</p>
            {data.knowledgeGraph.title && (
              <p className="mt-1 text-[14px] font-medium text-text">{data.knowledgeGraph.title}</p>
            )}
            <p className="mt-1 text-[13px] text-text-muted">{data.knowledgeGraph.description}</p>
          </div>
        )}

        {data.results.length === 0 ? (
          <p className="text-sm text-text-muted">Žádné výsledky.</p>
        ) : (
          <ol className="space-y-3">
            {data.results.map((r) => (
              <li key={r.link} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <p className="font-mono text-[10px] text-text-faint">
                    {String(r.position).padStart(2, "0")} · {hostname(r.link)}
                    {r.date && <span className="ml-2">{r.date}</span>}
                  </p>
                  <p className="mt-1 text-[14px] font-medium tracking-tight text-text group-hover:text-accent-bright">
                    {r.title}
                  </p>
                  {r.snippet && (
                    <p className="mt-1 text-[12px] leading-relaxed text-text-muted">{r.snippet}</p>
                  )}
                </a>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

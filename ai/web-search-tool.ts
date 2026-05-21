import { tool } from "ai";
import { z } from "zod";

type SerperOrganic = {
  title: string;
  link: string;
  snippet?: string;
  position?: number;
  date?: string;
};
type SerperResponse = {
  organic?: SerperOrganic[];
  answerBox?: {
    title?: string;
    answer?: string;
    snippet?: string;
    link?: string;
  };
  knowledgeGraph?: { title?: string; description?: string; descriptionSource?: string };
  searchParameters?: { q?: string };
};

export const webSearchTool = tool({
  description:
    "Hledá na internetu přes Google (Serper API). Použij pro otázky o aktuálních cenách, novinkách, externích webech, datech mimo naši DB. Vrací top 5 organických výsledků + případně answer box. Backend potřebuje SERPER_API_KEY env var.",
  inputSchema: z.object({
    query: z.string().describe("Vyhledávací dotaz, ideálně česky"),
    numResults: z.number().int().min(1).max(10).default(5),
  }),
  execute: async ({ query, numResults }) => {
    const key = process.env.SERPER_API_KEY;
    if (!key) {
      return {
        ok: false,
        query,
        error:
          "SERPER_API_KEY není nastaven. Pro nasazení vyžaduje klíč z https://serper.dev (2 500 free dotazů/měsíc).",
        results: [],
      };
    }
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, gl: "cz", hl: "cs", num: numResults }),
      });
      if (!res.ok) {
        return {
          ok: false,
          query,
          error: `Serper API vrátil ${res.status}: ${await res.text()}`,
          results: [],
        };
      }
      const data = (await res.json()) as SerperResponse;
      const organic = (data.organic ?? []).slice(0, numResults).map((r, i) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet ?? "",
        date: r.date,
        position: r.position ?? i + 1,
      }));
      return {
        ok: true,
        query,
        answerBox: data.answerBox ?? null,
        knowledgeGraph: data.knowledgeGraph ?? null,
        results: organic,
        engine: "Google (via Serper)",
      };
    } catch (e) {
      return {
        ok: false,
        query,
        error: e instanceof Error ? e.message : "Neznámá chyba při web search.",
        results: [],
      };
    }
  },
});

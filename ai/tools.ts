import { tool } from "ai";
import { z } from "zod";
import {
  getNewClients, getLeadsAndSalesTrend, proposeViewingSlots,
  auditMissingRenovationData, weeklyReport, setupMarketMonitoring,
  listAgents, queryProperties,
} from "@/lib/queries";

const QuarterSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);

export const tools = {
  getNewClients: tool({
    description:
      "Spočítá nové klienty za zadaný kvartál a rozdělí je dle zdroje (Sreality, web, doporučení atd.). Použij pro otázky typu 'Jaké nové klienty máme za Q1?' nebo 'Odkud přišli klienti za druhý kvartál?'. Vrací data pro pie/bar chart.",
    inputSchema: z.object({
      quarter: QuarterSchema.describe("Kvartál — Q1, Q2, Q3 nebo Q4"),
      year: z.number().int().min(2020).max(2030).describe("Rok, např. 2026"),
      chartType: z.enum(["pie", "bar"]).optional().describe("Typ grafu, default pie"),
    }),
    execute: async ({ quarter, year, chartType }) => {
      const data = getNewClients(quarter, year);
      return { ...data, chartType: chartType ?? "pie" };
    },
  }),

  getLeadsAndSalesTrend: tool({
    description:
      "Vykreslí měsíční vývoj počtu nových leadů a prodaných nemovitostí za posledních N měsíců. Použij pro otázky o trendu, vývoji, srovnání po měsících.",
    inputSchema: z.object({
      monthsBack: z.number().int().min(2).max(14).default(6)
        .describe("Kolik měsíců zpět zobrazit (default 6)"),
      district: z.string().optional()
        .describe("Volitelná lokalita — Praha-Holešovice, Praha-Vinohrady, ..."),
    }),
    execute: async ({ monthsBack, district }) => {
      return getLeadsAndSalesTrend(monthsBack, district);
    },
  }),

  proposeViewingSlots: tool({
    description:
      "Najde volné termíny prohlídky v Pepově kalendáři a připraví návrh e-mailu zájemci. Použij pro otázky typu 'Napiš e-mail zájemci a doporuč termín' nebo 'Kdy mám volno na schůzku?'.",
    inputSchema: z.object({
      propertyRef: z.string().optional()
        .describe("Kód nemovitosti, např. RH-1042 (pokud zájemce o konkrétní nemovitost)"),
      daysAhead: z.number().int().min(1).max(14).default(7)
        .describe("Kolik pracovních dnů dopředu hledat (default 7)"),
      slotMinutes: z.number().int().min(30).max(180).default(60)
        .describe("Délka slotu v minutách (default 60)"),
    }),
    execute: async ({ propertyRef, daysAhead, slotMinutes }) => {
      return proposeViewingSlots(propertyRef, daysAhead, slotMinutes);
    },
  }),

  auditMissingRenovationData: tool({
    description:
      "Vrátí seznam nemovitostí, kterým v systému chybí data o rekonstrukci a stavebních úpravách, seřazené podle priority (aktivně nabízené první, pak dle ceny sestupně). Použij pro otázky typu 'Najdi nemovitosti bez dat o rekonstrukci' nebo 'Připrav seznam k doplnění'.",
    inputSchema: z.object({
      district: z.string().optional()
        .describe("Volitelná lokalita pro zúžení (např. Praha-Holešovice)"),
      minPrice: z.number().int().optional()
        .describe("Minimální cena v Kč pro zúžení (např. 5000000)"),
    }),
    execute: async ({ district, minPrice }) => {
      return auditMissingRenovationData(district, minPrice);
    },
  }),

  weeklyReport: tool({
    description:
      "Sestaví týdenní report pro vedení s klíčovými metrikami (nové leady, prodeje, objem, provize, pipeline, top makléř) a připraví 3-slidovou prezentaci. Použij pro otázky typu 'Shrň minulý týden' nebo 'Připrav prezentaci pro vedení'.",
    inputSchema: z.object({
      weekEnding: z.string().optional()
        .describe("Datum konce týdne ve formátu YYYY-MM-DD, default = včera"),
      includeSlides: z.boolean().default(true)
        .describe("Vykreslit i 3-slidovou prezentaci (default true)"),
    }),
    execute: async ({ weekEnding, includeSlides }) => {
      return { ...weeklyReport(weekEnding), includeSlides };
    },
  }),

  listAgents: tool({
    description:
      "Vrátí seznam všech makléřů firmy s jejich KPI (počet prodejů, objem, provize, aktivní inzeráty, chybějící data). Použij pro dotazy typu 'Jaké jsou jména makléřů?', 'Kdo je nejlepší makléř za celou dobu?', 'Kolik prodal Petr Svoboda?'.",
    inputSchema: z.object({}),
    execute: async () => listAgents(),
  }),

  queryProperties: tool({
    description:
      "Univerzální dotaz nad databází nemovitostí — filtruj dle lokality, typu, ceny, plochy, stavu, layoutu, dostupnosti dat o rekonstrukci. Použij pro libovolný dotaz o konkrétních nemovitostech, který nezvládají ostatní tooly. Vrací počet shod, průměrnou cenu, rozdělení dle statusu a top 25 řádků.",
    inputSchema: z.object({
      district: z.string().optional().describe("Lokalita — Praha-Holešovice, Praha-Karlín, Brno-střed, ..."),
      type: z.string().optional().describe("Typ — 'Byt 2+kk', 'Rodinný dům', 'Pozemek', 'Komerční prostor' atd."),
      status: z.enum(["nabízí se", "rezervováno", "prodáno"]).optional(),
      layout: z.string().optional().describe("Dispozice u bytů, např. 'Byt 2+kk'"),
      minPrice: z.number().int().optional().describe("Minimální cena v Kč"),
      maxPrice: z.number().int().optional().describe("Maximální cena v Kč"),
      minArea: z.number().int().optional().describe("Minimální plocha m²"),
      maxArea: z.number().int().optional().describe("Maximální plocha m²"),
      hasRenovationData: z.boolean().optional().describe("true = jen s vyplněnými daty, false = jen bez nich"),
      limit: z.number().int().min(1).max(100).default(25).describe("Maximální počet řádků v odpovědi"),
    }),
    execute: async (filters) => queryProperties(filters),
  }),

  setupMarketMonitoring: tool({
    description:
      "Nastaví pravidelný ranní monitoring nových nabídek na realitních serverech pro zadanou lokalitu. Použij pro otázky typu 'Sleduj nabídky v Praze 7 a každé ráno mě informuj'.",
    inputSchema: z.object({
      district: z.string()
        .describe("Lokalita — Praha-Holešovice, Praha-Vinohrady, Brno-střed atd."),
      time: z.string().default("07:30")
        .describe("Čas ranního briefingu ve formátu HH:MM (default 07:30)"),
      portals: z.array(z.string()).default([])
        .describe("Seznam portálů, default Sreality/Bezrealitky/iDNES"),
    }),
    execute: async ({ district, time, portals }) => {
      return setupMarketMonitoring(district, time, portals);
    },
  }),
} as const;

export type Tools = typeof tools;

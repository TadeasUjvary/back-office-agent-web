import { NextResponse } from "next/server";
import { listBriefings, seedHistoricalBriefings } from "@/lib/db/briefings";

export const runtime = "nodejs";

function getUserId(req: Request): string | null {
  const v = req.headers.get("x-user-id");
  if (!v) return null;
  return decodeURIComponent(v).trim() || null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  const url = new URL(req.url);
  const district = url.searchParams.get("district") ?? "Praha-Holešovice";
  try {
    await seedHistoricalBriefings(userId, district);
    const rows = await listBriefings(userId, district);
    return NextResponse.json({ briefings: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed" },
      { status: 500 },
    );
  }
}

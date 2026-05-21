import { NextResponse } from "next/server";
import { advanceSimDay } from "@/lib/db/briefings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = decodeURIComponent(req.headers.get("x-user-id") ?? "").trim();
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  try {
    const briefing = await advanceSimDay(userId);
    return NextResponse.json({ briefing });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "advance failed" },
      { status: 500 },
    );
  }
}

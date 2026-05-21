import { NextResponse } from "next/server";
import { createConversation, listConversations } from "@/lib/db/conversations";

export const runtime = "nodejs";

function getUserId(req: Request): string | null {
  const headerVal = req.headers.get("x-user-id");
  if (!headerVal) return null;
  return decodeURIComponent(headerVal).trim() || null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  try {
    const rows = await listConversations(userId);
    return NextResponse.json({ conversations: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body?.title as string | undefined) ?? null;
    const conv = await createConversation(userId, title);
    return NextResponse.json({ conversation: conv });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "create failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import {
  getOrCreateUserConversation,
  loadMessages,
  wipeMessages,
} from "@/lib/db/conversations";

export const runtime = "nodejs";

function getUserId(req: Request): string | null {
  const v = req.headers.get("x-user-id");
  if (!v) return null;
  return decodeURIComponent(v).trim() || null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  try {
    const conv = await getOrCreateUserConversation(userId);
    const messages = await loadMessages(conv.id);
    return NextResponse.json({ conversation: conv, messages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed" },
      { status: 500 },
    );
  }
}

/** DELETE wipes all messages but keeps the conversation row. */
export async function DELETE(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  try {
    await wipeMessages(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "wipe failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { removeEvent } from "@/lib/db/calendar";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = decodeURIComponent(req.headers.get("x-user-id") ?? "").trim();
  if (!userId) return NextResponse.json({ error: "missing x-user-id" }, { status: 401 });
  const { id } = await params;
  try {
    await removeEvent(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "delete failed" },
      { status: 500 },
    );
  }
}

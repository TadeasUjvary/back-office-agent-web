import { NextResponse } from "next/server";
import { getConversation, deleteConversation, renameConversation } from "@/lib/db/conversations";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await getConversation(id);
    if (!res) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteConversation(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "delete failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const title = body?.title as string;
    if (typeof title !== "string") {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    await renameConversation(id, title);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "rename failed" },
      { status: 500 },
    );
  }
}

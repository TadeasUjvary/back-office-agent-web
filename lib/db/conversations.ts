import "server-only";
import { getServerSupabase } from "@/lib/supabase";

export type Conversation = {
  id: string;
  user_id: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
};

export type StoredMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  parts: unknown[];
  created_at: string;
};

/** Get or create THE single conversation for this user.
 *  We now keep exactly one conversation per user — simpler model. */
export async function getOrCreateUserConversation(userId: string): Promise<Conversation> {
  const sb = getServerSupabase();
  // Find existing
  const { data: existing, error: findErr } = await sb
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(1);
  if (findErr) throw findErr;
  if (existing && existing.length > 0) return existing[0] as Conversation;

  // Create
  const { data: created, error: createErr } = await sb
    .from("conversations")
    .insert({ user_id: userId, title: "Konverzace" })
    .select()
    .single();
  if (createErr) throw createErr;
  return created as Conversation;
}

export async function loadMessages(conversationId: string): Promise<StoredMessage[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}

/** Upsert messages — idempotent on id. */
export async function saveMessages(
  conversationId: string,
  messages: Array<{ id: string; role: "user" | "assistant" | "system"; parts: unknown[] }>,
) {
  if (messages.length === 0) return;
  const sb = getServerSupabase();
  const rows = messages.map((m) => ({
    id: m.id,
    conversation_id: conversationId,
    role: m.role,
    parts: m.parts,
  }));
  const { error } = await sb.from("messages").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  await sb
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

/** Wipe all messages for the user's single conversation. */
export async function wipeMessages(userId: string) {
  const sb = getServerSupabase();
  const conv = await getOrCreateUserConversation(userId);
  const { error } = await sb.from("messages").delete().eq("conversation_id", conv.id);
  if (error) throw error;
}

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

export async function listConversations(userId: string, limit = 30) {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function getConversation(id: string) {
  const sb = getServerSupabase();
  const [conv, msgs] = await Promise.all([
    sb.from("conversations").select("*").eq("id", id).single(),
    sb.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
  ]);
  if (conv.error) return null;
  return {
    conversation: conv.data as Conversation,
    messages: (msgs.data ?? []) as StoredMessage[],
  };
}

export async function createConversation(userId: string, title: string | null = null) {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("conversations")
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function deleteConversation(id: string) {
  const sb = getServerSupabase();
  const { error } = await sb.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

export async function renameConversation(id: string, title: string) {
  const sb = getServerSupabase();
  const { error } = await sb.from("conversations").update({ title }).eq("id", id);
  if (error) throw error;
}

/** Upsert messages — idempotent on id, useful for streaming finalize. */
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
  // Touch last_message_at
  await sb
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

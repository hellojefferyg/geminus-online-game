/**
 * src/lib/chat.ts
 * Live chat over Supabase (table public.chat_messages + Realtime).
 * Main and Sales are shared by every player; Clan and Group channels stay local
 * until clans/groups exist. The server sets the sender's name from their players row.
 */

import { supabase } from '../supabase'

export const LIVE_CHANNELS = ['main', 'sales'] as const
export const CHAT_HISTORY = 50
export const CHAT_MAX_LENGTH = 300

export interface ChatLine { id?: number; sender: string; text: string; color: string; role?: string | null; system?: boolean }

/** The role comes from the server (set by the database trigger), so it can't be faked. */
function toLine(row: any): ChatLine {
  return { id: row.id, sender: row.sender_name || 'Pilot', role: row.sender_role || null, text: row.body, color: row.color || '#3EE0FF' }
}

export function isLiveChannel(channel: string): boolean {
  return (LIVE_CHANNELS as readonly string[]).includes(channel)
}

/** Most recent messages for a channel, oldest first. */
export async function loadRecent(channel: string): Promise<ChatLine[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, sender_name, sender_role, color, body, created_at')
    .eq('channel', channel)
    .order('created_at', { ascending: false })
    .limit(CHAT_HISTORY)
  if (error) { console.error('[chat] load failed:', error.message); return [] }
  return (data || []).reverse().map(toLine)
}

/** Calls onMessage(channel, line) for every new message. Returns an unsubscribe function. */
export function subscribeChat(onMessage: (channel: string, line: ChatLine) => void): () => void {
  const sub = supabase
    .channel('chat-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      payload => onMessage((payload.new as any).channel, toLine(payload.new)))
    .subscribe()
  return () => { supabase.removeChannel(sub) }
}

export async function sendChat(channel: string, text: string): Promise<string | null> {
  const body = text.trim().slice(0, CHAT_MAX_LENGTH)
  if (!body) return null
  const { error } = await supabase.from('chat_messages').insert({ channel, body })
  return error ? error.message : null
}

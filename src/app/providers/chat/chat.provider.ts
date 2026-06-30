import { Injectable } from "@angular/core";
import { supabase } from '../../../lib/supabase';
import { ChatMessage } from "../../ui/organisms/chat-window/models/chat-message";

export type CreateChatMessage = Pick<ChatMessage, "content" | "sent" | "client_id" | "read">;

@Injectable({
  providedIn: "root",
})
export class ChatProvider {

  async getMessages(clientId: string): Promise<{ total: number; documents: ChatMessage[] }> {
    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .order('timestamp');
    if (error) throw error;
    return { total: count ?? 0, documents: (data ?? []) as ChatMessage[] };
  }

  async getRecentMessages(clientId: string, limit: number = 50): Promise<{ total: number; documents: ChatMessage[] }> {
    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { total: count ?? 0, documents: (data ?? []) as ChatMessage[] };
  }

  async sendMessage(message: CreateChatMessage): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ ...message, timestamp: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as ChatMessage;
  }

  async markAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
    if (error) throw error;
  }

  async markAllAsRead(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('read', false);
    if (error) throw error;
  }
}

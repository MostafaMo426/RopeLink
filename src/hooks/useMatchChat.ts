'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ChatMessage } from '@/types/database';

export function useMatchChat(matchId?: string, currentUserId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(*)')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data as ChatMessage[]);
        }
      }
    } catch (err) {
      console.warn('Chat fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    fetchMessages();

    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`chat_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch sender profile info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender: senderProfile || null },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchMessages]);

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!matchId || !currentUserId || !content.trim()) return false;

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('chat_messages').insert({
          match_id: matchId,
          sender_id: currentUserId,
          content: content.trim(),
        });

        if (error) throw error;
        return true;
      } else {
        // Local simulation fallback
        const mockMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          match_id: matchId,
          sender_id: currentUserId,
          content: content.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, mockMsg]);
        return true;
      }
    } catch (err) {
      console.error('Send message error:', err);
      return false;
    }
  };

  return {
    messages,
    loading,
    refreshMessages: fetchMessages,
    sendMessage,
  };
}

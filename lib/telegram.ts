import Constants from 'expo-constants';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL ||
  '';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

/**
 * Telegram API integration
 * This is a placeholder for the actual Telegram API integration
 * You'll need to implement the actual Telegram client using a library like telegram
 */

export interface TelegramChat {
  id: string;
  name: string;
  type: 'private' | 'group' | 'channel';
  lastMessage?: string;
  timestamp?: string;
  avatar?: string;
  messageCount?: number;
}

export interface TelegramMessage {
  id: number;
  chatId: string;
  text: string | null;
  date: Date;
  isOutgoing: boolean;
}

export class TelegramClient {
  private currentUserId: string | null = null; // we use phoneNumber as userId for now

  constructor() {
    if (!API_BASE_URL) {
      console.warn(
        'EXPO_PUBLIC_API_URL is not set. TelegramClient will not be able to call backend functions.'
      );
    }
  }

  /**
   * Send verification code to phone number
   */
  async sendCode(phoneNumber: string): Promise<{ phoneCodeHash: string }> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('API base URL or Supabase anon key is not configured');
    }

    const res = await fetch(`${API_BASE_URL}/telegram-send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId: phoneNumber,
        phoneNumber,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('sendCode error:', body);
      throw new Error('Failed to send verification code');
    }

    const data = (await res.json()) as { phoneCodeHash: string };
    // Remember userId for subsequent calls
    this.currentUserId = phoneNumber;
    return data;
  }

  /**
   * Verify the code sent to the phone
   */
  async signIn(
    phoneNumber: string,
    phoneCodeHash: string,
    code: string
  ): Promise<{ success: boolean; user?: any }> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('API base URL or Supabase anon key is not configured');
    }

    const res = await fetch(`${API_BASE_URL}/telegram-sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId: phoneNumber,
        phoneNumber,
        phoneCodeHash,
        code,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('signIn error:', body);
      throw new Error('Failed to verify code');
    }

    this.currentUserId = phoneNumber;

    return { success: true, user: { id: phoneNumber, phoneNumber } };
  }

  /**
   * Get list of all chats
   */
  async getChats(): Promise<TelegramChat[]> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('API base URL or Supabase anon key is not configured');
    }
    if (!this.currentUserId) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_BASE_URL}/telegram-get-chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ userId: this.currentUserId }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('getChats error:', body);
      throw new Error('Failed to load chats');
    }

    const data = (await res.json()) as {
      chats: {
        id: string;
        title: string | null;
        type: string;
        lastMessage: { id: number; text: string | null; date: string | null } | null;
        unreadCount: number;
      }[];
    };

    return data.chats.map((chat) => ({
      id: chat.id,
      name: chat.title || 'Unknown chat',
      type:
        chat.type === 'channel'
          ? 'channel'
          : chat.type === 'group'
          ? 'group'
          : 'private',
      lastMessage: chat.lastMessage?.text || undefined,
      timestamp: chat.lastMessage?.date || undefined,
      avatar: undefined,
      messageCount: chat.unreadCount,
    }));
  }

  /**
   * Get messages from a specific chat
   */
  async getMessages(
    chatId: string,
    limit: number = 100
  ): Promise<TelegramMessage[]> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('API base URL or Supabase anon key is not configured');
    }
    if (!this.currentUserId) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_BASE_URL}/telegram-get-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId: this.currentUserId,
        chatId,
        limit,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('getMessages error:', body);
      throw new Error('Failed to load messages');
    }

    const data = (await res.json()) as {
      messages: { id: number; text: string | null; date: string | null; outgoing: boolean }[];
    };

    return data.messages.map((m) => ({
      id: m.id,
      chatId,
      text: m.text,
      date: m.date ? new Date(m.date) : new Date(0),
      isOutgoing: m.outgoing,
    }));
  }

  /**
   * Delete messages based on time filter
   */
  async deleteMessages(
    chatId: string,
    messageIds: number[]
  ): Promise<{ success: boolean; deletedCount: number }> {
    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('API base URL or Supabase anon key is not configured');
    }
    if (!this.currentUserId) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_BASE_URL}/telegram-delete-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId: this.currentUserId,
        chatId,
        messageIds,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('deleteMessages error:', body);
      throw new Error('Failed to delete messages');
    }

    const data = (await res.json()) as { success: boolean; deletedCount: number };
    return data;
  }

  /**
   * Filter messages by time range
   */
  filterMessagesByTime(
    messages: TelegramMessage[],
    timeRange: 'last_day' | 'last_week' | 'all' | 'custom',
    customRange?: { startDate: Date; endDate: Date }
  ): TelegramMessage[] {
    const now = new Date();
    
    switch (timeRange) {
      case 'last_day':
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return messages.filter(msg => msg.date >= oneDayAgo);
      
      case 'last_week':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return messages.filter(msg => msg.date >= oneWeekAgo);
      
      case 'custom':
        if (customRange) {
          // Set time to start of start date and end of end date
          const startOfDay = new Date(customRange.startDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(customRange.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          return messages.filter(msg => 
            msg.date >= startOfDay && msg.date <= endOfDay
          );
        }
        return messages;
      
      case 'all':
      default:
        return messages;
    }
  }

  /**
   * Disconnect from Telegram
   */
  async disconnect(): Promise<void> {
    this.currentUserId = null;
  }
}

export const telegramClient = new TelegramClient();

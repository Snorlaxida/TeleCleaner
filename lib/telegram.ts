import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL ||
  '';

const SESSION_STRING_KEY = '@telegram_session_string';
const USER_ID_STORAGE_KEY = '@telegram_user_id';
const AUTH_TOKEN_KEY = '@auth_token';

// Fetch with timeout utility
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

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
  messageCount?: number; // Total number of user's messages in this chat
  avatarLoading?: boolean; // True if avatar is being loaded
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
  private authSessionString: string | null = null; // session string from sendCode for signIn
  private authToken: string | null = null; // JWT token for API authentication

  constructor() {
    if (!API_BASE_URL) {
      console.warn(
        'EXPO_PUBLIC_API_URL is not set. TelegramClient will not be able to call backend functions.'
      );
    }
  }

  /**
   * Save JWT token to persistent storage
   */
  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      this.authToken = token;
      console.log('Auth token saved successfully');
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  /**
   * Load JWT token from persistent storage
   */
  private async loadToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this.authToken = token;
        console.log('Auth token loaded successfully');
      }
      return token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
      return null;
    }
  }

  /**
   * Clear JWT token
   */
  private async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      this.authToken = null;
      console.log('Auth token cleared successfully');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  /**
   * Save user session to persistent storage
   * Saves both userId and Telegram sessionString
   */
  private async saveSession(userId: string, sessionString: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [USER_ID_STORAGE_KEY, userId],
        [SESSION_STRING_KEY, sessionString]
      ]);
      console.log('Session saved successfully:', userId);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load user session from persistent storage
   * Returns both userId and sessionString if available
   * Also loads JWT token into memory
   */
  async loadSession(): Promise<{ userId: string; sessionString: string } | null> {
    try {
      const [[, userId], [, sessionString], [, token]] = await AsyncStorage.multiGet([
        USER_ID_STORAGE_KEY,
        SESSION_STRING_KEY,
        AUTH_TOKEN_KEY
      ]);
      
      if (userId && sessionString) {
        this.currentUserId = userId;
        
        // Load token into memory if exists
        if (token) {
          this.authToken = token;
          console.log('Session and token loaded successfully:', userId);
        } else {
          console.log('Session loaded without token:', userId);
        }
        
        return { userId, sessionString };
      }
      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Clear saved session and auth token
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([USER_ID_STORAGE_KEY, SESSION_STRING_KEY, AUTH_TOKEN_KEY]);
      this.currentUserId = null;
      this.authSessionString = null;
      this.authToken = null;
      console.log('Session and auth token cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Get headers with authentication token
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const isAuth = this.currentUserId !== null && this.authToken !== null;
    console.log(`[TelegramClient] isAuthenticated: ${isAuth} (userId: ${this.currentUserId ? 'exists' : 'null'}, token: ${this.authToken ? 'exists' : 'null'})`);
    return isAuth;
  }

  /**
   * Restore session from saved sessionString
   * Returns true if session is valid, false otherwise
   */
  async restoreSession(userId: string, sessionString: string): Promise<boolean> {
    console.log('[TelegramClient] restoreSession called for userId:', userId);
    
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }

    try {
      console.log('[TelegramClient] Making restore session request to backend...');
      const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-restore-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, sessionString }),
      }, 30000);

      if (!res.ok) {
        const body = await res.text();
        console.error('[TelegramClient] restoreSession error:', body);
        return false;
      }

      const data = (await res.json()) as { success: boolean; valid: boolean; token?: string };
      console.log('[TelegramClient] restoreSession response:', { success: data.success, valid: data.valid, hasToken: !!data.token });
      
      if (data.success && data.valid && data.token) {
        this.currentUserId = userId;
        await this.saveToken(data.token);
        console.log('[TelegramClient] Session restored successfully with auth token');
        return true;
      }
      
      console.log('[TelegramClient] Session restore failed - invalid response');
      return false;
    } catch (error) {
      console.error('[TelegramClient] Failed to restore session:', error);
      return false;
    }
  }

  /**
   * Send verification code to phone number
   */
  async sendCode(phoneNumber: string): Promise<{ phoneCodeHash: string; sessionString: string }> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: phoneNumber,
        phoneNumber,
      }),
    }, 30000);

    if (!res.ok) {
      const body = await res.text();
      console.error('sendCode error:', body);
      throw new Error('Failed to send verification code');
    }

    const data = (await res.json()) as { phoneCodeHash: string; sessionString: string };
    // Remember userId and session string for subsequent calls
    this.currentUserId = phoneNumber;
    this.authSessionString = data.sessionString;
    return data;
  }

  /**
   * Verify the code sent to the phone
   */
  async signIn(
    phoneNumber: string,
    phoneCodeHash: string,
    code: string
  ): Promise<{ success: boolean; user?: any; requires2FA?: boolean; hint?: string }> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }

    // Must have session string from sendCode
    if (!this.authSessionString) {
      throw new Error('No auth session found. Please call sendCode first.');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: phoneNumber,
        phoneNumber,
        phoneCodeHash,
        code,
        sessionString: this.authSessionString,
      }),
    }, 30000);

    if (!res.ok) {
      const body = await res.text();
      console.error('signIn error:', body);
      throw new Error('Failed to verify code');
    }

    const data = await res.json();

    // Check if 2FA is required
    if (data.requires2FA) {
      // Keep session string for 2FA
      this.authSessionString = data.sessionString;
      return {
        success: false,
        requires2FA: true,
        hint: data.hint || '2FA password required',
      };
    }

    this.currentUserId = phoneNumber;
    
    // Get the authenticated sessionString from backend response
    const sessionString = data.sessionString || '';
    
    // Save session to persistent storage (userId + sessionString)
    await this.saveSession(phoneNumber, sessionString);
    
    // Save JWT token
    if (data.token) {
      await this.saveToken(data.token);
    }
    
    // Clear auth session after successful sign in
    this.authSessionString = null;

    return { success: true, user: { id: phoneNumber, phoneNumber } };
  }

  /**
   * Complete sign in with 2FA password
   */
  async signInWith2FA(
    phoneNumber: string,
    password: string
  ): Promise<{ success: boolean; user?: any }> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }

    // Must have session string from signIn
    if (!this.authSessionString) {
      throw new Error('No auth session found. Please call signIn first.');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-sign-in-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: phoneNumber,
        phoneNumber,
        password,
        sessionString: this.authSessionString,
      }),
    }, 30000);

    if (!res.ok) {
      const body = await res.text();
      console.error('signInWith2FA error:', body);
      throw new Error('Failed to verify 2FA password');
    }

    const data = await res.json();
    this.currentUserId = phoneNumber;
    
    // Get the authenticated sessionString from backend response
    const sessionString = data.sessionString || '';
    
    // Save session to persistent storage (userId + sessionString)
    await this.saveSession(phoneNumber, sessionString);
    
    // Save JWT token
    if (data.token) {
      await this.saveToken(data.token);
    }
    
    // Clear auth session after successful sign in
    this.authSessionString = null;

    return { success: true, user: { id: phoneNumber, phoneNumber } };
  }

  /**
   * Get list of all chats (quick version - without message counts)
   * This is fast and should be called first
   */
  async getChatsQuick(): Promise<TelegramChat[]> {
    console.log('[TelegramClient] getChatsQuick called');
    
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      console.error('[TelegramClient] getChatsQuick: No auth token! userId:', this.currentUserId);
      throw new Error('Not authenticated - no auth token');
    }

    console.log('[TelegramClient] Making request to get chats with auth token');
    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-get-chats-quick`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit: 0 }),
    }, 60000); // 1 minute timeout

    if (!res.ok) {
      const body = await res.text();
      console.error('getChatsQuick error:', body);
      throw new Error('Failed to load chats');
    }

    const data = (await res.json()) as {
      chats: {
        id: string;
        title: string | null;
        type: string;
        lastMessage: { id: number; text: string | null; date: string | null } | null;
        unreadCount: number;
        avatar?: string;
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
      avatar: chat.avatar,
      messageCount: chat.unreadCount, // Will be -1 indicating not yet counted
    }));
  }

  /**
   * Get list of all chats (full version with message counting - slow)
   */
  async getChats(): Promise<TelegramChat[]> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      throw new Error('Not authenticated - no auth token');
    }

    // Increase timeout to 5 minutes because counting all messages takes time
    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-get-chats`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit: 0 }),
    }, 300000); // 5 minutes timeout

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
        avatar?: string;
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
      avatar: chat.avatar,
      messageCount: chat.unreadCount,
    }));
  }

  /**
   * Count messages in a specific chat
   * For groups/channels: returns exact count
   * For private chats: returns -2 (displayed as "?" in UI)
   */
  async getChatMessageCount(chatId: string, isPrivateChat: boolean = false): Promise<number> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      throw new Error('Not authenticated - no auth token');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-count-messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ chatId, isPrivateChat }),
    }, 10000); // Reduced to 10 seconds (backend has 5s timeout)

    if (!res.ok) {
      const body = await res.text();
      console.error('getChatMessageCount error:', body);
      return 0;
    }

    const data = (await res.json()) as { chatId: string; count: number };
    return data.count;
  }

  /**
   * Get profile photo for a chat as base64 data URL
   */
  async getChatProfilePhoto(chatId: string): Promise<string | null> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      throw new Error('Not authenticated - no auth token');
    }

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-get-profile-photo`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ chatId }),
      }, 10000); // 10 second timeout

      if (!res.ok) {
        const body = await res.text();
        console.error('getChatProfilePhoto error:', body);
        return null;
      }

      const data = (await res.json()) as { chatId: string; photo: string | null };
      return data.photo;
    } catch (error) {
      console.error('Failed to get profile photo:', error);
      return null;
    }
  }

  /**
   * Get current user information
   */
  async getMe(): Promise<{ phone?: string; username?: string }> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      throw new Error('Not authenticated - no auth token');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-get-me`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({}),
    }, 10000);

    if (!res.ok) {
      const body = await res.text();
      console.error('getMe error:', body);
      throw new Error('Failed to get user info');
    }

    const data = (await res.json()) as { id: string; phone?: string; username?: string };
    return {
      phone: data.phone,
      username: data.username,
    };
  }

  /**
   * Get messages from a specific chat
   */
  async getMessages(
    chatId: string,
    limit: number = 100
  ): Promise<TelegramMessage[]> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      throw new Error('Not authenticated - no auth token');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-get-messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        chatId,
        limit,
      }),
    }, 30000);

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
   * Delete messages based on time filter or direct message IDs
   */
  async deleteMessages(
    chatId: string,
    options: {
      timeRange?: 'last_day' | 'last_week' | 'all' | 'custom';
      startDate?: Date;
      endDate?: Date;
      messageIds?: number[];
    }
  ): Promise<{ success: boolean; deletedCount: number }> {
    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured');
    }
    if (!this.authToken) {
      throw new Error('Not authenticated - no auth token');
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-delete-messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        chatId,
        messageIds: options.messageIds,
        timeRange: options.timeRange,
        startDate: options.startDate?.toISOString(),
        endDate: options.endDate?.toISOString(),
      }),
    }, 60000); // 60 second timeout for potentially large deletions

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
   * Logout from Telegram (clears session on both client and server)
   */
  async logout(): Promise<boolean> {
    if (!API_BASE_URL) {
      console.warn('API base URL not configured, clearing local session only');
      await this.clearSession();
      return true;
    }

    if (!this.authToken) {
      console.warn('Not authenticated, clearing local session only');
      await this.clearSession();
      return true;
    }

    try {
      // Call backend to clear server-side session (which also unsubscribes)
      const res = await fetchWithTimeout(`${API_BASE_URL}/telegram-logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({}),
      }, 10000);

      if (!res.ok) {
        const body = await res.text();
        console.error('logout error:', body);
      }

      // Always clear local session regardless of server response
      await this.clearSession();
      return true;
    } catch (error) {
      console.error('Failed to logout:', error);
      // Clear local session even if server call fails
      await this.clearSession();
      return true;
    }
  }

  /**
   * Disconnect from Telegram (alias for logout)
   */
  async disconnect(): Promise<void> {
    await this.logout();
  }

}

export const telegramClient = new TelegramClient();

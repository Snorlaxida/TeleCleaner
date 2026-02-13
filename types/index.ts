export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  photoId?: string; // Telegram photo_id for caching
  messageCount: number;
  type?: 'private' | 'group' | 'channel';
}

export interface Message {
  id: number;
  chatId: string;
  text: string;
  date: Date;
  isOutgoing: boolean;
}

export type DeletionTimeRange = 'last_day' | 'last_week' | 'all';

export interface DeletionResult {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  errors?: string[];
}

export interface User {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthSession {
  user: User;
  phoneCodeHash?: string;
  isAuthenticated: boolean;
}

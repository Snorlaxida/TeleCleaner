import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Avatar cache entry structure
 */
interface AvatarCacheEntry {
  chatId: string;
  photoId: string; // Telegram's photo_id - changes when user updates avatar
  photoData: string; // base64 encoded photo data
  timestamp: number; // When cached
}

/**
 * Client-side avatar cache using AsyncStorage
 * Works on iOS, Android, and Web (Telegram Mini App)
 */
class AvatarCache {
  private static readonly CACHE_PREFIX = '@avatar_cache:';
  private static readonly METADATA_KEY = '@avatar_cache_metadata';
  private static readonly MAX_CACHE_SIZE = 200; // Max number of cached avatars
  private static readonly MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  // In-memory cache for fast access (LRU)
  private memoryCache: Map<string, AvatarCacheEntry> = new Map();
  private metadata: { [chatId: string]: { photoId: string; timestamp: number } } = {};
  private initialized = false;

  /**
   * Initialize the cache (load metadata)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const metadataStr = await AsyncStorage.getItem(AvatarCache.METADATA_KEY);
      if (metadataStr) {
        this.metadata = JSON.parse(metadataStr);
        console.log(`[AvatarCache] Loaded metadata for ${Object.keys(this.metadata).length} avatars`);
      }
      this.initialized = true;
    } catch (error) {
      console.error('[AvatarCache] Failed to initialize:', error);
      this.metadata = {};
      this.initialized = true;
    }
  }

  /**
   * Get cached avatar if exists and photoId matches
   * @param chatId - Chat identifier
   * @param currentPhotoId - Current photo_id from Telegram
   * @returns Cached photo data or null if not found/outdated/photo changed
   */
  async get(chatId: string, currentPhotoId: string | null | undefined): Promise<string | null> {
    if (!currentPhotoId) return null;

    await this.initialize();

    // Check in-memory cache first (fastest)
    const memEntry = this.memoryCache.get(chatId);
    if (memEntry && memEntry.photoId === currentPhotoId) {
      const age = Date.now() - memEntry.timestamp;
      if (age <= AvatarCache.MAX_CACHE_AGE) {
        console.log(`[AvatarCache] Memory hit for chat ${chatId}`);
        return memEntry.photoData;
      }
    }

    // Check metadata to see if we have it in AsyncStorage
    const meta = this.metadata[chatId];
    if (!meta) {
      console.log(`[AvatarCache] Miss: no metadata for chat ${chatId}`);
      return null;
    }

    // Check if photoId changed (user updated avatar)
    if (meta.photoId !== currentPhotoId) {
      console.log(`[AvatarCache] Photo changed for chat ${chatId}: ${meta.photoId} -> ${currentPhotoId}`);
      await this.delete(chatId);
      return null;
    }

    // Check if cache entry is too old
    const age = Date.now() - meta.timestamp;
    if (age > AvatarCache.MAX_CACHE_AGE) {
      console.log(`[AvatarCache] Expired for chat ${chatId} (age: ${Math.floor(age / 1000 / 60 / 60 / 24)} days)`);
      await this.delete(chatId);
      return null;
    }

    // Load from AsyncStorage
    try {
      const key = AvatarCache.CACHE_PREFIX + chatId;
      const entryStr = await AsyncStorage.getItem(key);
      
      if (!entryStr) {
        console.log(`[AvatarCache] Miss: no data for chat ${chatId}`);
        delete this.metadata[chatId];
        await this.saveMetadata();
        return null;
      }

      const entry: AvatarCacheEntry = JSON.parse(entryStr);
      
      // Add to memory cache for faster future access
      this.memoryCache.set(chatId, entry);
      
      // Keep memory cache size under control
      if (this.memoryCache.size > 50) {
        const firstKey = this.memoryCache.keys().next().value;
        if (firstKey) {
          this.memoryCache.delete(firstKey);
        }
      }

      console.log(`[AvatarCache] Storage hit for chat ${chatId}`);
      return entry.photoData;
    } catch (error) {
      console.error(`[AvatarCache] Failed to get from storage:`, error);
      return null;
    }
  }

  /**
   * Set/update cached avatar
   * @param chatId - Chat identifier
   * @param photoId - Current photo_id from Telegram
   * @param photoData - base64 encoded photo data
   */
  async set(chatId: string, photoId: string, photoData: string): Promise<void> {
    await this.initialize();

    try {
      const entry: AvatarCacheEntry = {
        chatId,
        photoId,
        photoData,
        timestamp: Date.now(),
      };

      // Save to AsyncStorage
      const key = AvatarCache.CACHE_PREFIX + chatId;
      await AsyncStorage.setItem(key, JSON.stringify(entry));

      // Update metadata
      this.metadata[chatId] = {
        photoId,
        timestamp: entry.timestamp,
      };

      // Add to memory cache
      this.memoryCache.set(chatId, entry);

      // Save metadata
      await this.saveMetadata();

      // Check if cache is too large and evict oldest entries
      const cacheSize = Object.keys(this.metadata).length;
      if (cacheSize > AvatarCache.MAX_CACHE_SIZE) {
        await this.evictOldest();
      }

      console.log(`[AvatarCache] Cached avatar for chat ${chatId} (photoId: ${photoId})`);
    } catch (error) {
      console.error('[AvatarCache] Failed to set:', error);
    }
  }

  /**
   * Remove specific chat from cache
   * @param chatId - Chat identifier
   */
  async delete(chatId: string): Promise<void> {
    await this.initialize();

    try {
      const key = AvatarCache.CACHE_PREFIX + chatId;
      await AsyncStorage.removeItem(key);
      delete this.metadata[chatId];
      this.memoryCache.delete(chatId);
      await this.saveMetadata();
      console.log(`[AvatarCache] Deleted cache for chat ${chatId}`);
    } catch (error) {
      console.error('[AvatarCache] Failed to delete:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.initialize();

    try {
      const keys = Object.keys(this.metadata).map(chatId => AvatarCache.CACHE_PREFIX + chatId);
      await AsyncStorage.multiRemove(keys);
      await AsyncStorage.removeItem(AvatarCache.METADATA_KEY);
      this.metadata = {};
      this.memoryCache.clear();
      console.log('[AvatarCache] Cleared all cache');
    } catch (error) {
      console.error('[AvatarCache] Failed to clear:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ size: number; maxSize: number; maxAge: number; memorySize: number }> {
    await this.initialize();
    return {
      size: Object.keys(this.metadata).length,
      maxSize: AvatarCache.MAX_CACHE_SIZE,
      maxAge: AvatarCache.MAX_CACHE_AGE,
      memorySize: this.memoryCache.size,
    };
  }

  /**
   * Save metadata to AsyncStorage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem(AvatarCache.METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('[AvatarCache] Failed to save metadata:', error);
    }
  }

  /**
   * Remove oldest cache entries (LRU-like eviction)
   * Removes 20% of cache size
   */
  private async evictOldest(): Promise<void> {
    const entriesToRemove = Math.floor(AvatarCache.MAX_CACHE_SIZE * 0.2);
    const sortedEntries = Object.entries(this.metadata).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    const keysToRemove: string[] = [];
    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      const [chatId] = sortedEntries[i];
      keysToRemove.push(AvatarCache.CACHE_PREFIX + chatId);
      delete this.metadata[chatId];
      this.memoryCache.delete(chatId);
    }

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      await this.saveMetadata();
      console.log(`[AvatarCache] Evicted ${keysToRemove.length} oldest entries`);
    }
  }
}

// Export singleton instance
export const avatarCache = new AvatarCache();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineActionItem } from '../types/student';

const QUEUE_STORAGE_KEY = 'kiet_offline_actions_queue';

export class OfflineQueue {
  /**
   * Enqueue action to local persistent queue
   */
  static async enqueue(type: OfflineActionItem['type'], payload: Record<string, unknown>): Promise<void> {
    try {
      const currentQueue = await this.getAll();
      const newItem: OfflineActionItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        payload,
        created_at: new Date().toISOString(),
      };

      currentQueue.push(newItem);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(currentQueue));
      console.log(`[OFFLINE QUEUE] Action enqueued: ${type}`, payload);
    } catch (e) {
      console.error('Failed to enqueue offline action:', e);
    }
  }

  /**
   * Get all pending items in the offline queue
   */
  static async getAll(): Promise<OfflineActionItem[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Flush queue: attempt to upload pending actions when internet is available
   */
  static async flush(onSuccess?: (item: OfflineActionItem) => void): Promise<number> {
    const queue = await this.getAll();
    if (queue.length === 0) return 0;

    let processedCount = 0;
    const remaining: OfflineActionItem[] = [];

    for (const item of queue) {
      try {
        console.log(`[OFFLINE SYNC] Syncing action ${item.type} (ID: ${item.id}) to Supabase...`);
        // Upload logic will sync to real Supabase tables in Prompt 6
        processedCount++;
        onSuccess?.(item);
      } catch (err) {
        console.warn(`[OFFLINE SYNC] Failed to sync ${item.id}, retaining in queue:`, err);
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    return processedCount;
  }

  /**
   * Clear all items
   */
  static async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

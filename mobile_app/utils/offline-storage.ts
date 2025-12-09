import { AppStorage } from './storage';
import { Event } from '@/services';

export class OfflineEventStorage {
    private static readonly EVENTS_CACHE_KEY = 'offline_events_cache';
    private static readonly MY_EVENTS_CACHE_KEY = 'offline_my_events_cache';
    private static readonly EVENTS_TIMESTAMP_KEY = 'offline_events_timestamp';
    private static readonly MY_EVENTS_TIMESTAMP_KEY = 'offline_my_events_timestamp';
    private static readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Save events to offline cache
     */
    static async saveEvents(events: Event[]): Promise<void> {
        try {
            await AppStorage.setItem(this.EVENTS_CACHE_KEY, events);
            console.log('Saved events to offline cache:', events);
            console.log('Events cache key:', this.EVENTS_CACHE_KEY);
            await AppStorage.setItem(this.EVENTS_TIMESTAMP_KEY, new Date().getTime());
        } catch (error) {
            console.error('Error saving events to offline cache:', error);
            throw error;
        }
    }

    /**
     * Save user's own events to offline cache
     */
    static async saveMyEvents(events: Event[]): Promise<void> {
        try {
            await AppStorage.setItem(this.MY_EVENTS_CACHE_KEY, events);
            await AppStorage.setItem(this.MY_EVENTS_TIMESTAMP_KEY, new Date().getTime());
        } catch (error) {
            console.error('Error saving my events to offline cache:', error);
            throw error;
        }
    }

    /**
     * Retrieve cached events
     */
    static async getEvents(): Promise<Event[] | null> {
        try {
            const events = await AppStorage.getItem<Event[]>(this.EVENTS_CACHE_KEY);
            return events && Array.isArray(events) ? events : null;
        } catch (error) {
            console.error('Error retrieving events from offline cache:', error);
            return null;
        }
    }

    /**
     * Retrieve cached my events
     */
    static async getMyEvents(): Promise<Event[] | null> {
        try {
            const events = await AppStorage.getItem<Event[]>(this.MY_EVENTS_CACHE_KEY);
            return events && Array.isArray(events) ? events : null;
        } catch (error) {
            console.error('Error retrieving my events from offline cache:', error);
            return null;
        }
    }

    /**
     * Check if cached events are still valid (not expired)
     */
    static async isCacheValid(): Promise<boolean> {
        try {
            const timestamp = await AppStorage.getItem<number>(this.EVENTS_TIMESTAMP_KEY);
            if (!timestamp) return false;

            const now = new Date().getTime();
            return now - (timestamp as number) < this.CACHE_DURATION_MS;
        } catch (error) {
            console.error('Error checking cache validity:', error);
            return false;
        }
    }

    /**
     * Check if cached my events are still valid (not expired)
     */
    static async isMyCacheValid(): Promise<boolean> {
        try {
            const timestamp = await AppStorage.getItem<number>(this.MY_EVENTS_TIMESTAMP_KEY);
            if (!timestamp) return false;

            const now = new Date().getTime();
            return now - (timestamp as number) < this.CACHE_DURATION_MS;
        } catch (error) {
            console.error('Error checking my cache validity:', error);
            return false;
        }
    }

    /**
     * Clear all offline event caches
     */
    static async clearCache(): Promise<void> {
        try {
            await Promise.all([
                AppStorage.removeItem(this.EVENTS_CACHE_KEY),
                AppStorage.removeItem(this.MY_EVENTS_CACHE_KEY),
                AppStorage.removeItem(this.EVENTS_TIMESTAMP_KEY),
                AppStorage.removeItem(this.MY_EVENTS_TIMESTAMP_KEY),
            ]);
        } catch (error) {
            console.error('Error clearing event cache:', error);
            throw error;
        }
    }

    /**
     * Get cache timestamp (for UI display purposes)
     */
    static async getCacheTimestamp(): Promise<Date | null> {
        try {
            const timestamp = await AppStorage.getItem<number>(this.EVENTS_TIMESTAMP_KEY);
            return timestamp ? new Date(timestamp) : null;
        } catch (error) {
            console.error('Error getting cache timestamp:', error);
            return null;
        }
    }

    /**
     * Check if there are any cached events available
     */
    static async hasLocalData(): Promise<boolean> {
        try {
            const events = await this.getEvents();
            const myEvents = await this.getMyEvents();
            const hasEvents = events && events.length > 0;
            const hasMyEvents = myEvents && myEvents.length > 0;
            return !!(hasEvents || hasMyEvents);
        } catch (error) {
            console.error('Error checking local data availability:', error);
            return false;
        }
    }
}

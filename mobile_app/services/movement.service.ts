import * as Location from 'expo-location';
import { apiClient } from './api.client';
import { geminiNotifier } from '@/utils/gemini-notifier';

type MovementType = 'standing' | 'walking' | 'driving';

interface Position { x: number; y: number }

class MovementService {
  private lastPosition: Position | null = null;
  private intervalId: number | null = null;
  private readonly intervalMs = 15 * 1000; // 1 minute

  // thresholds in meters per minute
  private readonly standingThreshold = 10; // <= 10m -> standing
  private readonly walkingThreshold = 100; // <=100m -> walking

  constructor() {}

  private haversineDistance(a: Position, b: Position): number {
    // returns distance in meters
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(b.y - a.y);
    const dLon = toRad(b.x - a.x);
    const lat1 = toRad(a.y);
    const lat2 = toRad(b.y);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  private classify(distanceMeters: number): MovementType {
    if (distanceMeters <= this.standingThreshold) return 'standing';
    if (distanceMeters <= this.walkingThreshold) return 'walking';
    return 'driving';
  }

  async start() {
    if (this.intervalId) {
      console.log('[MovementService] Already running');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[MovementService] Location permission not granted');
        return;
      }

      // seed initial position
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Highest });
      this.lastPosition = { x: pos.coords.longitude, y: pos.coords.latitude };
      console.log('[MovementService] Initial position set', this.lastPosition);

      // Start interval
      this.intervalId = setInterval(() => this.tick().catch(err => console.warn('[MovementService] tick error', err)), this.intervalMs) as unknown as number;
    } catch (e) {
      console.warn('[MovementService] start error', e);
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId as any);
      this.intervalId = null;
      console.log('[MovementService] stopped');
    }
  }

  private async tick() {
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Highest });
      const current: Position = { x: pos.coords.longitude, y: pos.coords.latitude };
      const timestamp = new Date().toISOString();

      if (!this.lastPosition) {
        this.lastPosition = current;
        return;
      }

      const distance = this.haversineDistance(this.lastPosition, current);
      const movement = this.classify(distance);

      console.log('[MovementService] tick', { timestamp, current, last: this.lastPosition, distance, movement });

      // Prepare payload to send to trigger endpoint
      const payload = {
        type: movement,
        time: timestamp,
        position: { x: current.x, y: current.y }
      };

      // Fire-and-forget the trigger call (log response)
      try {
        // If a popup is already open, skip sending trigger to avoid duplicate prompts
        try {
          if (geminiNotifier.isOpen && typeof geminiNotifier.isOpen === 'function' && geminiNotifier.isOpen()) {
            console.log('[MovementService] popup open — skipping trigger API call');
            // update lastPosition and exit early
            this.lastPosition = current;
            return;
          }
        } catch (e) {
          // if notifier doesn't have isOpen, continue as before
        }

        const resp = await apiClient.post('/ai-planner/trigger', payload);
        console.log('[MovementService] trigger response', resp);

        // If backend returned gemini.agent_message, notify UI
        try {
          const gem = (resp && (resp as any).data && (resp as any).data.gemini) || null;
          const agentMessage = gem?.agent_message || gem?.agentMessage || null;
          if (agentMessage) {
            geminiNotifier.notify({
              agentMessage,
              positiveText: gem?.buttons?.positive?.text || 'Yes',
              negativeText: gem?.buttons?.negative?.text || 'No',
              positiveAction: gem?.buttons?.positive?.action || undefined,
              negativeAction: gem?.buttons?.negative?.action || undefined,
              businessType: gem?.type || undefined,
              position: (resp as any)?.data?.data?.position || payload.position || undefined,
            });
          }
        } catch (e) {
          console.warn('[MovementService] failed to parse gemini from response', e);
        }
      } catch (err) {
        console.warn('[MovementService] trigger call failed', err);
      }

      // update lastPosition
      this.lastPosition = current;
    } catch (err) {
      console.warn('[MovementService] tick failed', err);
    }
  }
}

export const movementService = new MovementService();

export default movementService;

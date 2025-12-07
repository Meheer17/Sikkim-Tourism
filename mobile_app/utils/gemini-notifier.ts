type Position = {
  x: number;
  y: number;
};

type GeminiPayload = {
  agentMessage: string;
  positiveText?: string;
  negativeText?: string;
  // optional action keys coming from backend
  positiveAction?: string; // e.g. 'search' | 'remind'
  negativeAction?: string; // e.g. 'return'
  businessType?: string; // for search action
  position?: Position; // optional current position
};

type Listener = (p: GeminiPayload) => void;

class GeminiNotifier {
  private listeners: Listener[] = [];
  private open = false;

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => this.unsubscribe(fn);
  }

  unsubscribe(fn: Listener) {
    this.listeners = this.listeners.filter(l => l !== fn);
  }

  notify(payload: GeminiPayload) {
    this.listeners.forEach((l) => {
      try {
        l(payload);
      } catch (e) {
        console.warn('GeminiNotifier listener error', e);
      }
    });
  }

  setOpen(v: boolean) {
    this.open = !!v;
  }

  isOpen() {
    return this.open;
  }
}

export const geminiNotifier = new GeminiNotifier();
export type { GeminiPayload };

export default geminiNotifier;

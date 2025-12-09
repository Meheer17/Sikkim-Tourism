type Listener = (offline: boolean) => void;
type OpenRoutesListener = () => void;

class NetworkService {
  private listeners = new Set<Listener>();
  private openRoutesListeners = new Set<OpenRoutesListener>();
  private offline = false;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeOpenSavedRoutes(listener: OpenRoutesListener) {
    this.openRoutesListeners.add(listener);
    return () => this.openRoutesListeners.delete(listener);
  }

  setOffline(val: boolean) {
    if (this.offline === val) return;
    this.offline = val;
    this.listeners.forEach(l => l(val));
  }

  isOffline() {
    return this.offline;
  }

  requestOpenSavedRoutes() {
    this.openRoutesListeners.forEach(l => l());
  }
}

export const networkService = new NetworkService();

export default networkService;

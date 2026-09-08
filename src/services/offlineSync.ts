import { HealthReport } from '../types';

const OFFLINE_STORAGE_KEY = 'pashuraksha_offline_pending_reports';
const SIMULATED_OFFLINE_KEY = 'pashuraksha_simulated_offline';

export class OfflineSyncManager {
  private static listeners: Array<(isOnline: boolean, pendingCount: number) => void> = [];

  public static isOnline(): boolean {
    const isSimulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
    if (isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public static setSimulatedOffline(offline: boolean): void {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, offline ? 'true' : 'false');
    this.notifyListeners();
  }

  public static isSimulatedOffline(): boolean {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  }

  public static getPendingReports(): HealthReport[] {
    try {
      const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static savePendingReport(report: HealthReport): void {
    const pending = this.getPendingReports();
    const updated = [...pending, { ...report, isOfflineSubmission: true }];
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
    this.notifyListeners();
  }

  public static clearPendingReports(): void {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    this.notifyListeners();
  }

  public static subscribe(listener: (isOnline: boolean, pendingCount: number) => void): () => void {
    this.listeners.push(listener);
    // Initial call
    listener(this.isOnline(), this.getPendingReports().length);

    const onOnline = () => this.notifyListeners();
    const onOffline = () => this.notifyListeners();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      }
    };
  }

  private static notifyListeners(): void {
    const online = this.isOnline();
    const count = this.getPendingReports().length;
    this.listeners.forEach(l => l(online, count));
  }
}

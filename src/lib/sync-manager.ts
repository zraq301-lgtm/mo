const PREFIX = 'maamoul';

interface RetryQueue {
  tenantId: string;
  module: string;
  recordId: string;
  queuedAt: string;
}

export class SyncManager {
  private storageKey(tenantId: string, module: string, id: string): string {
    return `${PREFIX}:${tenantId}:${module}:${id}`;
  }

  private moduleKey(tenantId: string, module: string): string {
    return `${PREFIX}:${tenantId}:${module}:__ids`;
  }

  private retryKey(): string {
    return `${PREFIX}:__retry_queue`;
  }

  setLocal<T>(tenantId: string, module: string, id: string, data: T): void {
    const key = this.storageKey(tenantId, module, id);
    localStorage.setItem(key, JSON.stringify(data));

    // Track the ID in the module index
    const ids = this.getModuleIds(tenantId, module);
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(this.moduleKey(tenantId, module), JSON.stringify(ids));
    }
  }

  getLocal<T>(tenantId: string, module: string, id: string): T | null {
    const key = this.storageKey(tenantId, module, id);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  listLocal<T>(tenantId: string, module: string): T[] {
    const ids = this.getModuleIds(tenantId, module);
    return ids
      .map((id) => this.getLocal<T>(tenantId, module, id))
      .filter((r): r is T => r !== null);
  }

  private getModuleIds(tenantId: string, module: string): string[] {
    const raw = localStorage.getItem(this.moduleKey(tenantId, module));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  queueForRetry(tenantId: string, module: string, recordId: string): void {
    const queue = this.getRetryQueue();
    const exists = queue.find(
      (q) => q.tenantId === tenantId && q.module === module && q.recordId === recordId
    );
    if (!exists) {
      queue.push({ tenantId, module, recordId, queuedAt: new Date().toISOString() });
      localStorage.setItem(this.retryKey(), JSON.stringify(queue));
    }
  }

  getRetryQueue(): RetryQueue[] {
    const raw = localStorage.getItem(this.retryKey());
    if (!raw) return [];
    try {
      return JSON.parse(raw) as RetryQueue[];
    } catch {
      return [];
    }
  }

  removeFromRetryQueue(tenantId: string, module: string, recordId: string): void {
    const queue = this.getRetryQueue().filter(
      (q) => !(q.tenantId === tenantId && q.module === module && q.recordId === recordId)
    );
    localStorage.setItem(this.retryKey(), JSON.stringify(queue));
  }

  getPendingSyncCount(): number {
    return this.getRetryQueue().length;
  }

  clearModule(tenantId: string, module: string): void {
    const ids = this.getModuleIds(tenantId, module);
    ids.forEach((id) => {
      localStorage.removeItem(this.storageKey(tenantId, module, id));
    });
    localStorage.removeItem(this.moduleKey(tenantId, module));
  }
}

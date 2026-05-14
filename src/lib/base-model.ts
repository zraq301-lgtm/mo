import { GitHubClient } from './github-client';
import { SyncManager } from './sync-manager';
import { v4 as uuidv4 } from './uuid';

export type RecordStatus = 'active' | 'draft' | 'archived';

export interface BaseRecord {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: RecordStatus;
  sync_status: boolean;
  metadata: Record<string, unknown>;
}

export interface ModelConfig {
  tenantId: string;
  userId: string;
  githubClient: GitHubClient;
  syncManager: SyncManager;
}

export abstract class BaseModel<T extends BaseRecord> {
  protected module: string;
  protected tenantId: string;
  protected userId: string;
  protected github: GitHubClient;
  protected sync: SyncManager;

  constructor(module: string, config: ModelConfig) {
    this.module = module;
    this.tenantId = config.tenantId;
    this.userId = config.userId;
    this.github = config.githubClient;
    this.sync = config.syncManager;
  }

  protected buildBase(overrides: Partial<T> = {}): BaseRecord {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      tenant_id: this.tenantId,
      created_at: now,
      updated_at: now,
      created_by: this.userId,
      status: 'draft',
      sync_status: false,
      metadata: {},
      ...overrides,
    };
  }

  async save(record: T): Promise<T> {
    const updated: T = {
      ...record,
      updated_at: new Date().toISOString(),
      sync_status: false,
    };

    // Local-first: persist to localStorage
    this.sync.setLocal(this.tenantId, this.module, updated.id, updated);

    // Fire hooks before saving
    await this.beforeSave(updated);

    // Push to GitHub asynchronously
    this.pushToGitHub(updated);

    return updated;
  }

  async get(id: string): Promise<T | null> {
    // Check local cache first
    const cached = this.sync.getLocal<T>(this.tenantId, this.module, id);
    if (cached) return cached;

    // Fallback to GitHub
    const remote = await this.github.getRecord(this.tenantId, this.module, id);
    if (remote) {
      this.sync.setLocal(this.tenantId, this.module, id, remote as T);
      return remote as T;
    }
    return null;
  }

  async list(): Promise<T[]> {
    // Return local cache if populated
    const local = this.sync.listLocal<T>(this.tenantId, this.module);
    if (local.length > 0) return local;

    // Fetch index from GitHub
    const remote = await this.github.listRecords(this.tenantId, this.module);
    return remote as T[];
  }

  async delete(id: string): Promise<void> {
    const record = await this.get(id);
    if (!record) return;
    const archived = { ...record, status: 'archived' as RecordStatus, updated_at: new Date().toISOString() };
    await this.save(archived);
  }

  private async pushToGitHub(record: T): Promise<void> {
    try {
      await this.github.saveRecord(this.tenantId, this.module, record.id, record);
      const synced = { ...record, sync_status: true };
      this.sync.setLocal(this.tenantId, this.module, record.id, synced);
    } catch (err) {
      console.warn(`[${this.module}] GitHub sync deferred for ${record.id}:`, err);
      this.sync.queueForRetry(this.tenantId, this.module, record.id);
    }
  }

  // Override in subclasses to add domain-specific hooks
  protected async beforeSave(_record: T): Promise<void> {}
}


export { BaseModel }
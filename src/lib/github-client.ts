const REPO_OWNER = 'zraq301-lgtm';
const REPO_NAME = 'shggy';
const BASE_PATH = 'database';
const BRANCH = 'main';

interface GitHubFile {
  sha: string;
  content: string;
  encoding: string;
}

interface CommitResponse {
  content: { sha: string };
}

export class GitHubClient {
  private token: string;
  private baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

  constructor(token: string) {
    this.token = token;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  private buildPath(tenantId: string, module: string, recordId: string): string {
    return `${BASE_PATH}/${tenantId}/${module}/${recordId}.json`;
  }

  private buildIndexPath(tenantId: string, module: string): string {
    return `${BASE_PATH}/${tenantId}/${module}/_index.json`;
  }

  async getFile(path: string): Promise<{ data: unknown; sha: string } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/contents/${path}?ref=${BRANCH}`, {
        headers: this.headers(),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
      const file: GitHubFile = await res.json();
      const decoded = atob(file.content.replace(/\n/g, ''));
      return { data: JSON.parse(decoded), sha: file.sha };
    } catch {
      return null;
    }
  }

  async putFile(
    path: string,
    data: unknown,
    sha?: string,
    message?: string
  ): Promise<string> {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const body: Record<string, unknown> = {
      message: message ?? `erp: update ${path}`,
      content,
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${this.baseUrl}/contents/${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub PUT failed: ${res.status} ${err}`);
    }
    const result: CommitResponse = await res.json();
    return result.content.sha;
  }

  async saveRecord(
    tenantId: string,
    module: string,
    recordId: string,
    data: unknown
  ): Promise<void> {
    const path = this.buildPath(tenantId, module, recordId);
    const existing = await this.getFile(path);
    await this.putFile(
      path,
      data,
      existing?.sha,
      `erp[${module}]: save ${recordId}`
    );
    await this.updateIndex(tenantId, module, recordId, data);
  }

  async getRecord(
    tenantId: string,
    module: string,
    recordId: string
  ): Promise<unknown | null> {
    const path = this.buildPath(tenantId, module, recordId);
    const result = await this.getFile(path);
    return result?.data ?? null;
  }

  async listRecords(tenantId: string, module: string): Promise<unknown[]> {
    const indexPath = this.buildIndexPath(tenantId, module);
    const result = await this.getFile(indexPath);
    if (!result) return [];
    return (result.data as { records: unknown[] }).records ?? [];
  }

  private async updateIndex(
    tenantId: string,
    module: string,
    recordId: string,
    data: unknown
  ): Promise<void> {
    const indexPath = this.buildIndexPath(tenantId, module);
    const existing = await this.getFile(indexPath);
    const currentIndex = existing
      ? ((existing.data as { records: Record<string, unknown>[] }).records ?? [])
      : [];

    const idx = currentIndex.findIndex(
      (r: Record<string, unknown>) => r.id === recordId
    );
    const summary = this.buildSummary(data as Record<string, unknown>);

    if (idx >= 0) {
      currentIndex[idx] = summary;
    } else {
      currentIndex.push(summary);
    }

    await this.putFile(
      indexPath,
      { records: currentIndex, updated_at: new Date().toISOString() },
      existing?.sha,
      `erp[${module}]: update index`
    );
  }

  private buildSummary(data: Record<string, unknown>): Record<string, unknown> {
    return {
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      ...(data.name ? { name: data.name } : {}),
      ...(data.reference ? { reference: data.reference } : {}),
      ...(data.total ? { total: data.total } : {}),
    };
  }
}

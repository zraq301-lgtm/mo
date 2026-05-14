import { useState } from 'react';
import { useERP, Tenant } from '../context/erp-engine';
import { Shield, Database, GitBranch, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useERP();
  const [form, setForm] = useState({
    tenantName: '',
    tenantId: '',
    githubToken: '',
    userId: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.tenantName || !form.tenantId || !form.githubToken || !form.userId) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const tenant: Tenant = {
        id: form.tenantId,
        name: form.tenantName,
        githubToken: form.githubToken,
        userId: form.userId,
      };
      login(tenant);
    } catch {
      setError('Failed to initialize. Check your GitHub token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Maamoul ERP</h1>
          <p className="text-slate-400 mt-1 text-sm">GitHub-native Enterprise Resource Planning</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Connected to: github.com/zraq301-lgtm/shggy</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={form.tenantName}
                onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Tenant ID (unique slug)
              </label>
              <input
                type="text"
                placeholder="e.g. acme-corp"
                value={form.tenantId}
                onChange={(e) =>
                  setForm({ ...form, tenantId: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">User ID</label>
              <input
                type="text"
                placeholder="e.g. john.doe"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                GitHub Personal Access Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={form.githubToken}
                  onChange={(e) => setForm({ ...form, githubToken: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Needs repo read/write scope. Stored locally only.
              </p>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 rounded-lg px-3.5 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors mt-2"
            >
              {loading ? 'Connecting...' : 'Connect to Maamoul ERP'}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-slate-600">
          <Shield className="w-3 h-3" />
          <span>Data isolated per tenant. Token never leaves your device.</span>
        </div>
      </div>
    </div>
  );
}

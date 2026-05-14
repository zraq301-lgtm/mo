import { ReactNode } from 'react';
import { Plus, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { BaseRecord } from '../lib/base-model';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (record: T) => ReactNode;
}

interface RecordListProps<T extends BaseRecord> {
  title: string;
  records: T[];
  columns: Column<T>[];
  loading: boolean;
  onNew: () => void;
  onSelect: (record: T) => void;
  onRefresh: () => void;
}

export default function RecordList<T extends BaseRecord>({
  title,
  records,
  columns,
  loading,
  onNew,
  onSelect,
  onRefresh,
}: RecordListProps<T>) {
  const active = records.filter((r) => r.status !== 'archived');

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            Loading...
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
            <span>No records found.</span>
            <button
              onClick={onNew}
              className="text-blue-400 hover:text-blue-300 text-xs underline"
            >
              Create the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">
                    Sync
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {active.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => onSelect(record)}
                    className="hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3 text-slate-300">
                        {col.render
                          ? col.render(record)
                          : String((record as Record<string, unknown>)[col.key as string] ?? '-')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      {record.sync_status ? (
                        <Cloud className="w-3.5 h-3.5 text-emerald-500 inline" />
                      ) : (
                        <CloudOff className="w-3.5 h-3.5 text-amber-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

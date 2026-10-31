import React, { useState, useEffect } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';
import { auditService } from '../../services/analyticsService';
import { AuditLog } from '../../types';
import { Loader } from '../../components/common/Loader';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('All');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.list({ entity: entityFilter !== 'All' ? entityFilter : undefined });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">System Audit Trail</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Immutable log of all operational events, billing changes, user modifications, and monetary transitions.
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs">
          {(['All', 'Customer', 'Subscription', 'Invoice', 'Payment', 'Product', 'Plan', 'Quotation'] as const).map((ent) => (
            <button
              key={ent}
              onClick={() => setEntityFilter(ent)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                entityFilter === ent
                  ? 'bg-obsidian text-chartreuse shadow-xs'
                  : 'text-slategrey hover:text-obsidian'
              }`}
            >
              {ent}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader rows={8} />
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-bordergrey bg-white p-12 text-center text-xs text-slategrey shadow-subtle">
          No audit logs recorded for this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Operator</th>
                  <th className="px-5 py-3.5">Action Executed</th>
                  <th className="px-5 py-3.5">Target Entity</th>
                  <th className="px-5 py-3.5">Details & Metadata</th>
                  <th className="px-5 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-ivory/50">
                    <td className="px-5 py-3.5 text-slategrey whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-sans font-semibold text-obsidian">
                      {log.userName}
                      <span className="block text-[10px] text-slategrey font-normal uppercase">{log.userRole}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-forest">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-obsidian font-sans font-medium">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-slategrey truncate max-w-xs font-sans">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="px-5 py-3.5 text-slategrey">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Database, Search } from 'lucide-react';
import apiClient from '../../services/api/axios.client';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/audit?limit=200');
        setLogs(response.data.data);
      } catch (error) {
        console.error("Failed to load audit logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Retrieving security logs...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            System Audit Trail
          </h1>
          <p className="text-gray-500 text-sm mt-1">Immutable record of critical system operations and changes.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Filter by action, entity or user..." 
          className="w-full bg-transparent border-none focus:ring-0 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Details (JSON)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No logs found matching criteria.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{log.user.name}</span>
                        <span className="text-xs text-gray-500">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-sm italic text-gray-400">System / Anonymous</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-800' : 
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Activity className="w-3 h-3" /> {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                      <Database className="w-3 h-3 text-gray-400" /> {log.entity}
                    </span>
                    {log.entityId && <span className="block text-xs text-gray-400 font-mono mt-1">ID: {log.entityId.substring(0, 8)}...</span>}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsView;
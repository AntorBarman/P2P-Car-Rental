import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ScrollText,
  Eye,
  Shield,
  Car,
  Calendar,
  Wallet,
  User,
  X,
  Clock,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const AuditLogs = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  
  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/admin/audit-logs');
      setLogs(response.data.data || []);
    } catch (error) {
      console.warn('Audit logs endpoint not found, using empty list');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  
  const getActionIcon = (action) => {
    if (action?.includes('VEHICLE')) return Car;
    if (action?.includes('KYC')) return Shield;
    if (action?.includes('BOOKING')) return Calendar;
    if (action?.includes('PAYMENT')) return Wallet;
    if (action?.includes('USER')) return User;
    return ScrollText;
  };
  
  const getActionVariant = (action) => {
    if (action?.includes('APPROVED') || action?.includes('COMPLETED')) return 'success';
    if (action?.includes('REJECTED') || action?.includes('SUSPENDED')) return 'danger';
    if (action?.includes('PENDING')) return 'warning';
    return 'primary';
  };
  
  const filteredLogs = logs.filter((log) => {
    const searchStr = `${log.action || ''} ${log.actor_name || ''} ${log.table_name || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action?.includes(actionFilter.toUpperCase());
    return matchesSearch && matchesAction;
  });
  
  const uniqueActions = [...new Set(logs.map((log) => log.action).filter(Boolean))];
  
  if (loading) {
    return (
      <div>
        <PageHeader title="Audit Logs" description="System activity tracking" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader title="Audit Logs" description="Track all administrative actions" />
      
      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search by action, actor, entity..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>
      
      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">IP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{formatDate(log.created_at)}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-semibold">
                            {log.actor_name?.[0]?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <span className="text-sm">{log.actor_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon className="w-3.5 h-3.5 text-slate-400" />
                        <Badge variant={getActionVariant(log.action)} size="xs">
                          {log.action}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {log.table_name || 'N/A'}
                      {log.record_id && <span className="text-xs text-slate-400"> ({log.record_id?.slice(0, 8)})</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="py-10">
            <EmptyState
              title="No Audit Logs"
              description="Administrative actions will be recorded here."
              icon={ScrollText}
            />
          </div>
        )}
      </Card>
      
      {/* ============ LOG DETAILS MODAL ============ */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedLog(null)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-blue-600" />
                Audit Event
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Action */}
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Action</span>
                <Badge variant={getActionVariant(selectedLog.action)} size="sm">
                  {selectedLog.action}
                </Badge>
              </div>
              
              {/* Actor */}
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Actor</span>
                <span className="text-sm font-medium">{selectedLog.actor_name || 'System'}</span>
              </div>
              
              {/* Target */}
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Target</span>
                <span className="text-sm font-medium">
                  {selectedLog.table_name || 'N/A'}
                </span>
              </div>
              
              {/* Before */}
              {selectedLog.old_value && (
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-[10px] text-slate-400 uppercase mb-1">Before</p>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* After */}
              {selectedLog.new_value && (
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-[10px] text-green-500 uppercase mb-1">After</p>
                  <pre className="text-xs text-green-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* IP */}
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">IP Address</span>
                <span className="text-sm font-mono">{selectedLog.ip_address || '—'}</span>
              </div>
              
              {/* Timestamp */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Timestamp</span>
                <span className="text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(selectedLog.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
import { useState, useEffect, useCallback } from 'react';
import { Banknote, TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminCommissions = () => {
  const { accessToken } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchCommissions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/wallet/transactions?page=1&limit=100');
      const allTx = response.data.data || [];
      const commissions = allTx.filter((t) => t.transaction_type === 'commission');
      setTransactions(commissions);
    } catch (error) {
      setError('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);
  
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <ErrorState title="Failed" message={error} onRetry={fetchCommissions} />;
  
  const totalCommission = transactions.reduce((s, t) => s + Number(t.amount || 0), 0);
  
  return (
    <div>
      <PageHeader title="Commissions" description="Platform commission (15%) from all bookings" />
      
      <Card className="p-4 mb-3 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <Banknote className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-sm text-green-600">Total Platform Commission</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCommission)}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-0 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Booking</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-green-700">{formatCurrency(tx.amount)}</td>
                <td className="px-4 py-3 text-xs font-mono">{tx.booking_id?.slice(0, 8) || 'N/A'}</td>
                <td className="px-4 py-3 text-xs">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div className="py-8 text-center text-slate-400 text-sm">No commissions yet</div>
        )}
      </Card>
    </div>
  );
};

export default AdminCommissions;
import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
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
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminWallets = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const fetchWallets = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/wallet/transactions?page=1&limit=100');
      const allTx = response.data.data || [];
      
      // Sort by date descending
      const sorted = [...allTx].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Calculate running balance
      let runningBalance = 0;
      const txWithBalance = sorted.map((tx) => {
        const amount = Number(tx.amount || 0);
        if (tx.type === 'credit') {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
        return { ...tx, balance_after: runningBalance };
      });
      
      setTransactions(txWithBalance);
    } catch (error) {
      setError('Failed to load wallet transactions');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);
  
  const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebits = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const platformBalance = totalCredits - totalDebits;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = transactions
    .filter((t) => t.type === 'credit' && t.created_at?.split('T')[0] === todayStr)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  
  const pendingPayouts = transactions
    .filter((t) => t.transaction_type === 'withdrawal' && t.status === 'pending')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  
  const filteredTx = transactions.filter((tx) => {
    const searchStr = `${tx.description || ''} ${tx.reference_id || ''} ${tx.transaction_type || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.type === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  if (loading) {
    return (
      <div>
        <PageHeader title="Wallets" description="Platform wallet overview" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <PageHeader title="Wallets" />
        <ErrorState title="Failed" message={error} onRetry={fetchWallets} />
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader title="Wallet Management" description="All wallet transactions across platform" />
      
      {/* ============ WALLET OVERVIEW ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Platform Balance */}
        <Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-blue-700">
          <Wallet className="w-6 h-6 mb-2" />
          <p className="text-xs text-blue-200">Platform Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(platformBalance)}</p>
        </Card>
        
        {/* Today's Revenue */}
        <Card className="p-4">
          <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-xs text-slate-500">Today's Revenue</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(todayRevenue)}</p>
        </Card>
        
        {/* Pending Payout */}
        <Card className="p-4">
          <Clock className="w-6 h-6 text-yellow-600 mb-2" />
          <p className="text-xs text-slate-500">Pending Payout</p>
          <p className="text-2xl font-bold text-yellow-700">{formatCurrency(pendingPayouts)}</p>
        </Card>
      </div>
      
      {/* ============ FILTERS ============ */}
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search by description, reference..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Types</option>
          <option value="booking_payment">Booking Payment</option>
          <option value="commission">Commission</option>
          <option value="owner_earning">Owner Earning</option>
          <option value="deposit_refund">Deposit Refund</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="credit">Credits</option>
          <option value="debit">Debits</option>
        </select>
      </div>
      
      {/* ============ TRANSACTION TABLE ============ */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTx.slice(0, 50).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(tx.created_at)}
                    <span className="block text-[10px] text-slate-400">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.type === 'credit' ? 'paid' : 'failed'} size="xs" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-900">{tx.description || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{tx.transaction_type?.replace(/_/g, ' ')}</p>
                    {tx.reference_id && (
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {tx.reference_id}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                    {formatCurrency(tx.balance_after || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTx.length === 0 && (
          <div className="py-10">
            <EmptyState title="No Transactions" icon={Wallet} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminWallets;
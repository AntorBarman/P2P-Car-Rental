import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
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

const AdminPayments = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const fetchPayments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/admin/payments');
      setPayments(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  
  // Financial Calculations
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'initiated');
  const failedPayments = payments.filter((p) => p.status === 'failed');
  const refundedPayments = payments.filter((p) => p.status === 'refunded');
  
  const grossRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const platformRevenue = grossRevenue * 0.15;
  const ownerEarnings = grossRevenue * 0.85;
  const refundAmount = refundedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingSettlement = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  
  const filteredPayments = payments.filter((payment) => {
    const searchStr = `${payment.transaction_id || ''} ${payment.customer_name || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  if (loading) {
    return (
      <div>
        <PageHeader title="Payments" description="Financial overview" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <PageHeader title="Payments" description="Financial overview" />
        <ErrorState title="Failed" message={error} onRetry={fetchPayments} />
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader title="Payment Management" description="Track transactions and financial performance" />
      
      {/* ============ FINANCIAL OVERVIEW ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {/* Gross Revenue */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Gross Revenue</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(grossRevenue)}</p>
        </Card>
        
        {/* Platform Revenue */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-slate-500">Platform (15%)</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(platformRevenue)}</p>
        </Card>
        
        {/* Owner Earnings */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Banknote className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500">Owner (85%)</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(ownerEarnings)}</p>
        </Card>
        
        {/* Refunds */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs text-slate-500">Refunds</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(refundAmount)}</p>
        </Card>
        
        {/* Pending Settlement */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-xs text-slate-500">Pending</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(pendingSettlement)}</p>
        </Card>
      </div>
      
      {/* ============ REVENUE ANALYTICS (Simple Bar Chart) ============ */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold mb-4">Revenue Overview</h3>
        
        {/* Simple inline chart using paid payments by date */}
        <div className="flex items-end gap-2 h-32">
          {(() => {
            // Group by date (last 7 days)
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              const dayRevenue = paidPayments
                .filter((p) => p.created_at?.split('T')[0] === dateStr)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
              last7Days.push({
                date: dateStr,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayRevenue,
              });
            }
            
            const maxRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);
            
            return last7Days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">
                  {day.revenue > 0 ? `৳${(day.revenue / 1000).toFixed(1)}k` : ''}
                </span>
                <div
                  className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                  style={{ height: `${(day.revenue / maxRevenue) * 80}px`, minHeight: day.revenue > 0 ? '4px' : '2px' }}
                />
                <span className="text-[10px] text-slate-400">{day.label}</span>
              </div>
            ));
          })()}
        </div>
      </Card>
      
      {/* ============ FILTERS ============ */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search by transaction ID, customer..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      
      {/* ============ PAYMENTS TABLE ============ */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commission (15%)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Owner (85%)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.map((payment) => {
                const amount = Number(payment.amount || 0);
                const commission = amount * 0.15;
                const ownerEarning = amount * 0.85;
                
                return (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-mono">
                      {payment.transaction_id?.slice(0, 20)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {payment.customer_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {formatCurrency(commission)}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-600">
                      {formatCurrency(ownerEarning)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="py-10">
            <EmptyState
              title="No Payments Found"
              description="No transactions match your filters."
              icon={Wallet}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPayments;
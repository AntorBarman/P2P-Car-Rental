import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Search,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Eye
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
import paymentService from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomerPayments = () => {
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
      // ✅ Use paymentService
      const response = await paymentService.getMyPayments();
      setPayments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  
  const filteredPayments = payments.filter((payment) => {
    const searchStr = `${payment.transaction_id || ''} ${payment.booking_id || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalRefunded = payments.filter((p) => p.status === 'refunded').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  
  return (
    <div>
      <PageHeader title="Payment History" description="Track all your payment transactions" />
      
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3 text-center">
          <CreditCard className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Total Payments</p>
          <p className="text-lg font-bold">{payments.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Total Paid</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card className="p-3 text-center">
          <RotateCcw className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Refunds</p>
          <p className="text-lg font-bold text-yellow-700">{formatCurrency(totalRefunded)}</p>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input placeholder="Search transaction ID..." icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      
      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Transaction ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono">{payment.transaction_id?.slice(0, 20)}...</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={payment.status} size="sm" /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(payment.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/bookings/${payment.booking_id}`} className="text-blue-600 hover:underline text-xs flex items-center justify-end gap-1">
                    <Eye className="w-3 h-3" /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPayments.length === 0 && (
          <div className="py-8">
            <EmptyState title="No Payments" description="Your payment history will appear here." icon={CreditCard} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default CustomerPayments;
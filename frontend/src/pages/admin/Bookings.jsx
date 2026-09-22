import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Calendar, 
  Car, 
  User,
  ChevronRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminBookings = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/admin/bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  const getStatusVariant = (status) => {
    const variants = {
      'pending_payment': 'warning',
      'confirmed': 'success',
      'ongoing': 'primary',
      'completed': 'default',
      'cancelled': 'danger',
      'expired': 'default',
    };
    return variants[status] || 'default';
  };
  
  const filteredBookings = bookings.filter((booking) => {
    const searchStr = `${booking.customer_name || ''} ${booking.brand || ''} ${booking.model || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState title="Failed" message={error} onRetry={fetchBookings} />;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Booking Management</h1>
        <p className="text-slate-500">Monitor all bookings across the platform</p>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by customer, vehicle..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-4 py-2.5 text-sm">
          <option value="all">All Status</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono">{booking.id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm">{booking.customer_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {booking.brand === booking.model ? booking.brand : `${booking.brand} ${booking.model}`}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(booking.total_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(booking.status)} size="sm">{booking.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length === 0 && (
          <p className="text-center py-8 text-slate-400">No bookings found</p>
        )}
      </Card>
    </div>
  );
};

export default AdminBookings;
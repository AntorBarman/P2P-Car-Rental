import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar,
  Car,
  Eye,
  Check,
  Clock,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import bookingService from '../../services/bookingService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OwnerBookings = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.getOwnerBookings();
      setBookings(response.data || []);
    } catch (error) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  
  const getTimeline = (booking) => {
    return [
      { label: 'Booking Created', status: 'completed', time: formatDate(booking.created_at) },
      { label: 'Payment', status: booking.payment_status === 'paid' ? 'completed' : 'active', time: null },
      { label: 'Pickup', status: booking.status === 'ongoing' || booking.status === 'completed' ? 'completed' : 'upcoming', time: formatDate(booking.pickup_date) },
      { label: 'Return', status: booking.status === 'completed' ? 'completed' : 'upcoming', time: formatDate(booking.return_date) },
      { label: 'Completed', status: booking.status === 'completed' ? 'completed' : 'upcoming', time: null },
    ];
  };
  
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <ErrorState title="Failed" message={error} onRetry={fetchBookings} />;
  
  const filteredBookings = activeFilter === 'all' 
    ? bookings 
    : bookings.filter((b) => b.status === activeFilter);
  
  const statusCounts = {
    all: bookings.length,
    pending_payment: bookings.filter((b) => b.status === 'pending_payment').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    ongoing: bookings.filter((b) => b.status === 'ongoing').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };
  
  return (
    <div>
      <PageHeader title="Rental Orders" description="Manage your vehicle bookings" />
      
      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-white border border-slate-200 rounded-lg p-1 w-fit overflow-x-auto">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize whitespace-nowrap ${
              activeFilter === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {key.replace(/_/g, ' ')} ({count})
          </button>
        ))}
      </div>
      
      {/* Bookings List */}
      <div className="space-y-2">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-slate-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {booking.brand === booking.model ? booking.brand : `${booking.brand} ${booking.model}`}
                </p>
                <p className="text-[10px] text-slate-500">
                  {booking.customer_name} • {booking.customer_phone || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
                </p>
              </div>
              
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatCurrency(booking.total_amount)}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <StatusBadge status={booking.status} size="xs" />
                  {booking.payment_status === 'paid' && (
                    <Badge variant="success" size="xs">
                      <Check className="w-3 h-3 mr-0.5" /> Paid
                    </Badge>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedBooking(booking)}
                className="p-1.5 hover:bg-blue-50 rounded-lg shrink-0"
                title="View Details"
              >
                <Eye className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </Card>
        ))}
        
        {filteredBookings.length === 0 && (
          <EmptyState title="No Bookings" description="No bookings match this filter." icon={Calendar} />
        )}
      </div>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBooking(null)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 hover:bg-slate-100 rounded">✕</button>
            </div>
            
            <div className="mb-3">
              <p className="text-sm font-semibold">
                {selectedBooking.brand === selectedBooking.model ? selectedBooking.brand : `${selectedBooking.brand} ${selectedBooking.model}`}
              </p>
              <StatusBadge status={selectedBooking.status} size="sm" className="mt-1" />
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg mb-3">
              <p className="text-xs font-semibold mb-1">Customer</p>
              <p className="text-sm">{selectedBooking.customer_name}</p>
              <p className="text-xs text-slate-500">{selectedBooking.customer_phone}</p>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg mb-3">
              <p className="text-xs font-semibold mb-1">Payment</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-bold">{formatCurrency(selectedBooking.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500">Payment</span>
                <Badge variant={selectedBooking.payment_status === 'paid' ? 'success' : 'warning'} size="xs">
                  {selectedBooking.payment_status || 'pending'}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold mb-2">Booking Timeline</p>
              <div className="space-y-2">
                {getTimeline(selectedBooking).map((step, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 ${
                      step.status === 'completed' ? 'bg-green-600' : step.status === 'active' ? 'bg-yellow-500' : 'bg-slate-200'
                    }`}>
                      {step.status === 'completed' && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${step.status === 'active' ? 'text-yellow-700' : 'text-slate-700'}`}>
                        {step.label}
                      </p>
                      {step.time && <p className="text-[10px] text-slate-400">{step.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Car } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBookings } from '../../features/bookings/bookingSlice';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters';

const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings, isLoading, error } = useSelector((state) => state.bookings);
  
  const [activeTab, setActiveTab] = useState('all');
  const [imgErrors, setImgErrors] = useState({});
  
  useEffect(() => {
    dispatch(fetchMyBookings({ page: 1, limit: 20 }));
  }, [dispatch]);
  
  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter((b) => b.status === activeTab);
  
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">My Bookings</h1>
      <p className="text-slate-500 mb-6">Track and manage your car rentals</p>
      
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending_payment', label: 'Pending' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'ongoing', label: 'Ongoing' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-70">
              ({tab.key === 'all' ? bookings.length : bookings.filter((b) => b.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>
      
      {error && (
        <ErrorState
          title="Failed to Load Bookings"
          message={error}
          onRetry={() => dispatch(fetchMyBookings({ page: 1, limit: 20 }))}
        />
      )}
      
      {!error && filteredBookings.length === 0 && (
        <EmptyState
          title="No Bookings Found"
          description="You haven't made any bookings yet."
          icon={Car}
          action={
            <Link to="/vehicles" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
              Browse Vehicles
            </Link>
          }
        />
      )}
      
      {!error && filteredBookings.length > 0 && (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {booking.brand === booking.model
                          ? `${booking.brand} ${booking.year}`
                          : `${booking.brand} ${booking.model} ${booking.year}`}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
                      </p>
                    </div>
                    
                    <Badge variant={getStatusVariant(booking.status)}>
                      {formatStatus(booking.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">Booking ID: {booking.id?.slice(0, 8)}</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(booking.total_amount)}
                      </p>
                    </div>
                    
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      View Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
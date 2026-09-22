import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronRight,
  Car,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import bookingService from '../../services/bookingService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomerCalendar = () => {
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    
    try {
      const response = await bookingService.getMyBookings({ page: 1, limit: 50 });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(null);
  };
  
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  // Get bookings for a specific date
  const getBookingsForDate = (day) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).toISOString().split('T')[0];
    
    return bookings.filter((booking) => {
      const pickupDate = booking.pickup_date?.split('T')[0];
      const returnDate = booking.return_date?.split('T')[0];
      return dateStr >= pickupDate && dateStr <= returnDate && booking.status !== 'cancelled';
    });
  };
  
  const getBookingStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      ongoing: 'bg-blue-500',
      completed: 'bg-slate-400',
      cancelled: 'bg-red-400',
    };
    return colors[status] || 'bg-slate-300';
  };
  
  // Upcoming trips list
  const upcomingTrips = bookings
    .filter((b) => ['confirmed', 'pending_payment'].includes(b.status))
    .sort((a, b) => new Date(a.pickup_date) - new Date(b.pickup_date));
  
  // Past trips
  const pastTrips = bookings
    .filter((b) => ['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => new Date(b.return_date) - new Date(a.return_date));
  
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  
  return (
    <div>
      <PageHeader title="Calendar" description="View your upcoming and past trips" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ============ CALENDAR (2/3 width) ============ */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={goToPreviousMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-semibold">{monthName}</h2>
                <button onClick={goToNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={goToToday} className="text-xs text-blue-600 hover:underline">
                Today
              </button>
            </div>
            
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-[10px] font-medium text-slate-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-16 bg-slate-50 rounded-lg" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dayBookings = getBookingsForDate(day);
                const today = new Date();
                const isToday = 
                  day === today.getDate() && 
                  currentMonth.getMonth() === today.getMonth() && 
                  currentMonth.getFullYear() === today.getFullYear();
                const isSelected = selectedDate === day;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`h-16 border rounded-lg p-1 text-left transition-colors ${
                      isToday ? 'border-blue-600 bg-blue-50' : 
                      isSelected ? 'border-blue-400 bg-blue-100' : 
                      'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    
                    {dayBookings.length > 0 && (
                      <div className="space-y-0.5 mt-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className={`px-1 py-0.5 rounded text-[7px] text-white truncate ${getBookingStatusColor(booking.status)}`}
                          >
                            {booking.brand} {booking.model}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <p className="text-[7px] text-slate-400">+{dayBookings.length - 2}</p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-green-500" /> Confirmed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-blue-500" /> Ongoing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-slate-400" /> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-red-400" /> Cancelled
              </span>
            </div>
          </Card>
        </div>
        
        {/* ============ TRIP LIST (1/3 width) ============ */}
        <div className="space-y-3">
          {/* Upcoming Trips */}
          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold">Upcoming Trips ({upcomingTrips.length})</h3>
            </div>
            
            {upcomingTrips.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {upcomingTrips.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/bookings/${booking.id}`}
                    className="px-3 py-2.5 block hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-xs font-medium truncate">
                        {booking.brand === booking.model ? booking.brand : `${booking.brand} ${booking.model}`}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-medium">{formatCurrency(booking.total_amount)}</span>
                      <StatusBadge status={booking.status} size="xs" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No upcoming trips</p>
            )}
          </Card>
          
          {/* Past Trips */}
          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold">Past Trips ({pastTrips.length})</h3>
            </div>
            
            {pastTrips.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {pastTrips.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/bookings/${booking.id}`}
                    className="px-3 py-2.5 block hover:bg-slate-50"
                  >
                    <p className="text-xs font-medium truncate">
                      {booking.brand === booking.model ? booking.brand : `${booking.brand} ${booking.model}`}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400">{formatDate(booking.return_date)}</span>
                      <StatusBadge status={booking.status} size="xs" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No past trips</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerCalendar;
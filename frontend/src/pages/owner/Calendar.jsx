import { useState, useCallback, useEffect } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Car,
  Calendar as CalendarIcon,
  Clock,
  Plus,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import vehicleService from '../../services/vehicleService';
import bookingService from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatters';

const OwnerCalendar = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    
    try {
      const [vehiclesRes, bookingsRes] = await Promise.all([
        vehicleService.getMyVehicles(),
        bookingService.getOwnerBookings(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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
      if (selectedVehicle !== 'all' && booking.vehicle_id !== selectedVehicle) return false;
      
      const pickupDate = booking.pickup_date?.split('T')[0];
      const returnDate = booking.return_date?.split('T')[0];
      
      return dateStr >= pickupDate && dateStr <= returnDate;
    });
  };
  
  const getBookingStatusColor = (booking) => {
    const colors = {
      pending_payment: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      ongoing: 'bg-blue-500',
      completed: 'bg-slate-400',
      cancelled: 'bg-red-400',
    };
    return colors[booking.status] || 'bg-slate-300';
  };
  
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  
  return (
    <div>
      <PageHeader title="Calendar" description="View vehicle availability and bookings" />
      
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
      </div>
      
      {/* Calendar */}
      <Card className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPreviousMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <button onClick={goToNextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
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
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-20 bg-slate-50 rounded-lg" />
          ))}
          
          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayBookings = getBookingsForDate(day);
            const today = new Date();
            const isToday = 
              day === today.getDate() && 
              currentMonth.getMonth() === today.getMonth() && 
              currentMonth.getFullYear() === today.getFullYear();
            
            return (
              <div
                key={day}
                className={`h-20 border rounded-lg p-1 overflow-hidden ${
                  isToday ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[8px] text-slate-400">{dayBookings.length} booking(s)</span>
                  )}
                </div>
                
                {/* Booking chips */}
                <div className="space-y-0.5 mt-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left px-1 py-0.5 rounded text-[8px] text-white truncate ${getBookingStatusColor(booking)}`}
                    >
                      {booking.brand} {booking.model}
                    </button>
                  ))}
                  {dayBookings.length > 2 && (
                    <p className="text-[8px] text-slate-400">+{dayBookings.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-yellow-500" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-green-500" /> Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Ongoing
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-400" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-red-400" /> Cancelled
          </span>
        </div>
      </Card>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBooking(null)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 hover:bg-slate-100 rounded">✕</button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <p className="font-medium">
                  {selectedBooking.brand} {selectedBooking.model}
                </p>
              </div>
              
              <div className="text-sm">
                <p><span className="text-slate-500">Dates:</span> {new Date(selectedBooking.pickup_date).toLocaleDateString()} → {new Date(selectedBooking.return_date).toLocaleDateString()}</p>
                <p><span className="text-slate-500">Customer:</span> {selectedBooking.customer_name}</p>
                <p><span className="text-slate-500">Amount:</span> {formatCurrency(selectedBooking.total_amount)}</p>
              </div>
              
              <StatusBadge status={selectedBooking.status} size="sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCalendar;
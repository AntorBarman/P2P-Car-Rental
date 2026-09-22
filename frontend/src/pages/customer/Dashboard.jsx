import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Calendar, 
  Wallet, 
  Clock, 
  ChevronRight,
  Search,
  User,
  Shield,
  AlertCircle,
  MapPin,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import KpiCard from '../../components/admin/KpiCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/admin/StatusBadge';
import bookingService from '../../services/bookingService';
import walletService from '../../services/walletService';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomerDashboard = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [balance, setBalance] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const bookingsRes = await bookingService.getMyBookings({ page: 1, limit: 50 });
      setBookings(bookingsRes.data || []);
      
      try {
        const balanceRes = await walletService.getBalance();
        const balanceData = balanceRes.data || balanceRes;
        setBalance({
          ...balanceData,
          currentBalance: Math.max(0, Number(balanceData?.currentBalance || balanceData?.balance || 0)),
        });
      } catch (e) {
        setBalance({ currentBalance: 0 });
      }
      
      try {
        const kycRes = await api.get('/documents/my');
        setDocuments(kycRes.data.data || []);
      } catch (e) {
        setDocuments([]);
      }
    } catch (error) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <ErrorState title="Failed" message={error} onRetry={fetchDashboardData} />;
  }
  
  // ============ BUSINESS CALCULATIONS ============
  
  const now = new Date();
  
  // Upcoming = confirmed/pending AND pickup_date > now
  const upcomingTrips = bookings.filter((b) => 
    ['confirmed', 'pending_payment'].includes(b.status) && 
    new Date(b.pickup_date) > now
  );
  
  // Active = ongoing OR (confirmed AND pickup_date <= now <= return_date)
  const activeTrips = bookings.filter((b) => {
    if (b.status === 'ongoing') return true;
    const pickup = new Date(b.pickup_date);
    const returnD = new Date(b.return_date);
    return b.status === 'confirmed' && pickup <= now && returnD >= now;
  });
  
  const completedTrips = bookings.filter((b) => b.status === 'completed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');
  
  // Next trip = upcoming sorted by pickup date
  const nextTrip = [...upcomingTrips].sort((a, b) => new Date(a.pickup_date) - new Date(b.pickup_date))[0];
  
  // KYC
  const approvedDocs = documents.filter((d) => d.status === 'approved');
  const kycComplete = approvedDocs.length >= 2;
  
  const walletBalance = balance?.currentBalance || 0;
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-500">Here's what's happening with your trips.</p>
        </div>
        <Link to="/vehicles">
          <Button size="sm">
            <Search className="w-4 h-4" />
            Browse Cars
          </Button>
        </Link>
      </div>
      
      {/* KYC Alert */}
      {!kycComplete && (
        <Link to="/kyc" className="block bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3 hover:bg-yellow-100">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">Complete Your KYC</p>
            <p className="text-xs text-yellow-600">
              {approvedDocs.length}/2 documents verified. Upload NID + License to book vehicles.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-yellow-600" />
        </Link>
      )}
      
      {/* ============ NEXT TRIP CARD ============ */}
      {nextTrip ? (
        <Card className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-blue-200">Your Next Trip</p>
              <p className="text-lg font-bold mt-1">
                {nextTrip.brand === nextTrip.model ? nextTrip.brand : `${nextTrip.brand} ${nextTrip.model}`}
              </p>
              <p className="text-xs text-blue-200 mt-0.5">
                {nextTrip.year} • {nextTrip.vehicle_type}
              </p>
            </div>
            <Badge variant="success" size="sm">Confirmed</Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-sm text-blue-100">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(nextTrip.pickup_date)} → {formatDate(nextTrip.return_date)}
            </span>
            {nextTrip.branch_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {nextTrip.branch_name}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-[10px] text-blue-200">Total Amount</p>
              <span className="font-bold text-xl">{formatCurrency(nextTrip.total_amount)}</span>
            </div>
            <Link to={`/bookings/${nextTrip.id}`} className="bg-white text-blue-700 px-4 py-2 rounded-lg text-xs font-semibold">
              View Booking →
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">No upcoming trips</p>
          <p className="text-xs text-slate-400 mb-3">Browse available vehicles and book your next adventure.</p>
          <Link to="/vehicles">
            <Button size="sm">
              <Search className="w-4 h-4" />
              Browse Cars
            </Button>
          </Link>
        </Card>
      )}
      
      {/* ============ KPI CARDS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Calendar} label="Total Bookings" value={bookings.length} color="blue" onClick={() => navigate('/bookings')} />
        <KpiCard icon={Clock} label="Upcoming Trips" value={upcomingTrips.length} color="green" onClick={() => navigate('/bookings')} />
        <KpiCard icon={Activity} label="Active Trip" value={activeTrips.length} color="purple" onClick={() => navigate('/bookings')} />
        <KpiCard icon={CheckCircle} label="Completed" value={completedTrips.length} color="yellow" onClick={() => navigate('/bookings')} />
      </div>
      
      {/* ============ FINANCIAL CARD ============ */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Wallet Balance</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(walletBalance)}</p>
          </div>
        </div>
        <Link to="/wallet" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          View Wallet <ChevronRight className="w-3 h-3" />
        </Link>
      </Card>
      
      {/* ============ RECENT BOOKINGS ============ */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Bookings</h3>
          <Link to="/bookings" className="text-xs text-blue-600 hover:underline">View All</Link>
        </div>
        
        {bookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 5).map((booking) => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-slate-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {booking.brand === booking.model ? booking.brand : `${booking.brand} ${booking.model}`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
                  </p>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{formatCurrency(booking.total_amount)}</p>
                  <StatusBadge status={booking.status} size="xs" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No bookings yet</p>
        )}
      </Card>
    </div>
  );
};

export default CustomerDashboard;
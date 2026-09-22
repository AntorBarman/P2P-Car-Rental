import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Car, 
  Calendar, 
  Plus,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Bell,
  CheckCircle,
  FileText,
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
import vehicleService from '../../services/vehicleService';
import bookingService from '../../services/bookingService';
import walletService from '../../services/walletService';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OwnerDashboard = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchOwnerData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const vehiclesRes = await vehicleService.getMyVehicles();
      setVehicles(vehiclesRes.data || []);
      
      const bookingsRes = await bookingService.getOwnerBookings();
      setBookings(bookingsRes.data || []);
      
      const balanceRes = await walletService.getBalance();
      setBalance(balanceRes.data || balanceRes);
      
      const txRes = await walletService.getTransactions({ page: 1, limit: 50 });
      setTransactions(txRes.data || []);
      
      const docsRes = await api.get('/documents/my');
      setDocuments(docsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchOwnerData();
  }, [fetchOwnerData]);
  
  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <ErrorState title="Failed" message={error} onRetry={fetchOwnerData} />;
  }
  
  // ============ BUSINESS CALCULATIONS ============
  
  const totalEarnings = balance?.totalCredit || 0;
  const availableBalance = balance?.currentBalance || balance?.balance || 0;
  
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);
  const monthStartStr = monthStart.toISOString().split('T')[0];
  const thisMonthEarnings = transactions
    .filter((t) => t.type === 'credit' && t.created_at?.split('T')[0] >= monthStartStr)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  
  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'ongoing');
  const pendingBookings = bookings.filter((b) => b.status === 'pending_payment');
  
  const availableVehicles = vehicles.filter((v) => v.status === 'approved' || v.status === 'available');
  const pendingVehicles = vehicles.filter((v) => v.status === 'pending');
  
  const approvedDocs = documents.filter((d) => d.status === 'approved');
  const kycComplete = approvedDocs.length >= 2;
  
  // ✅ Vehicles with pending documents
  const vehiclesWithPendingDocs = vehicles.map((vehicle) => {
    const vehicleDocs = documents.filter((d) => d.vehicle_id === vehicle.id);
    const approvedVehicleDocs = vehicleDocs.filter((d) => d.status === 'approved');
    const requiredDocs = 3;
    const pendingDocCount = Math.max(requiredDocs - approvedVehicleDocs.length, 0);
    
    return {
      ...vehicle,
      pendingDocCount,
      hasPendingDocs: pendingDocCount > 0,
    };
  }).filter((v) => v.hasPendingDocs);
  
  // ✅ Total pending actions count
  const totalPendingActions = 
    (kycComplete ? 0 : 1) + 
    vehiclesWithPendingDocs.length + 
    pendingVehicles.length +
    pendingBookings.length + 
    (availableBalance > 0 ? 1 : 0);
  
  // Fleet performance
  const fleetPerformance = vehicles.map((vehicle) => {
    const vehicleBookings = bookings.filter((b) => b.vehicle_id === vehicle.id);
    const completedVehicleBookings = vehicleBookings.filter((b) => b.status === 'completed' || b.status === 'confirmed');
    const vehicleRevenue = completedVehicleBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const utilization = vehicle.total_bookings > 0
      ? Math.min(Math.round((vehicle.total_bookings / 30) * 100), 100)
      : 0;
    
    return {
      ...vehicle,
      bookingCount: vehicleBookings.length,
      revenue: vehicleRevenue,
      utilization,
    };
  });
  
  // Revenue chart
  const revenueChartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const revenue = transactions
        .filter((t) => t.type === 'credit' && t.created_at?.split('T')[0] === dateStr)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      days.push({ label: date.toLocaleDateString('en-US', { weekday: 'short' }), revenue });
    }
    return days;
  })();
  
  const maxRevenue = Math.max(...revenueChartData.map((d) => d.revenue), 1);
  
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-500">Here's what's happening with your fleet today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg relative">
            <Bell className="w-4 h-4 text-slate-600" />
            {totalPendingActions > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <Link to="/owner/vehicles/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </Link>
        </div>
      </div>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Wallet} label="Total Earnings" value={formatCurrency(totalEarnings)} color="green" onClick={() => navigate('/owner/earnings')} />
        <KpiCard icon={TrendingUp} label="This Month" value={formatCurrency(thisMonthEarnings)} color="blue" onClick={() => navigate('/owner/earnings')} />
        <KpiCard icon={Calendar} label="Active Bookings" value={activeBookings.length} color="purple" onClick={() => navigate('/owner/bookings')} />
        <KpiCard icon={Car} label="Available Fleet" value={`${availableVehicles.length}/${vehicles.length}`} color="yellow" onClick={() => navigate('/owner/vehicles')} />
      </div>
      
      {/* KYC ALERT */}
      {!kycComplete && (
        <Link to="/owner/documents" className="block bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3 hover:bg-yellow-100 transition-colors">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">Complete Your KYC</p>
            <p className="text-xs text-yellow-600">
              {approvedDocs.length}/2 documents verified. Upload required documents to unlock all features.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-yellow-600" />
        </Link>
      )}
      
      {/* REVENUE PERFORMANCE */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Revenue Performance
          </h3>
          <span className="text-[10px] text-slate-400">Last 7 days</span>
        </div>
        
        <div className="flex items-end gap-2 h-28">
          {revenueChartData.map((day) => (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-500">{day.revenue > 0 ? `৳${(day.revenue / 1000).toFixed(1)}k` : ''}</span>
              <div className={`w-full rounded-t ${day.revenue > 0 ? 'bg-green-600' : 'bg-slate-200'}`} style={{ height: `${(day.revenue / maxRevenue) * 60}px`, minHeight: day.revenue > 0 ? '4px' : '1px' }} />
              <span className="text-[9px] text-slate-400">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>
      
      {/* FLEET PERFORMANCE + PENDING ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Fleet Performance */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Fleet Performance
            </h3>
            <Link to="/owner/vehicles" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          
          {fleetPerformance.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {fleetPerformance.slice(0, 5).map((vehicle) => (
                <div key={vehicle.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {vehicle.brand === vehicle.model ? vehicle.brand : `${vehicle.brand} ${vehicle.model}`}
                    </p>
                    <p className="text-[10px] text-slate-400">{vehicle.bookingCount} bookings • {formatCurrency(vehicle.revenue)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${vehicle.utilization}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{vehicle.utilization}%</span>
                  </div>
                  <StatusBadge status={vehicle.status} size="xs" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No vehicles yet</p>
          )}
        </Card>
        
        {/* Pending Actions — Detailed */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Pending Actions</h3>
            {totalPendingActions > 0 && <Badge variant="warning" size="xs">{totalPendingActions}</Badge>}
          </div>
          
          <div className="space-y-2">
            {/* 1. KYC */}
            {!kycComplete && (
              <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-yellow-800">Complete Owner KYC</p>
                    <p className="text-[10px] text-yellow-600 mt-0.5">
                      {approvedDocs.length}/2 verified • {2 - approvedDocs.length} remaining
                    </p>
                    <Link to="/owner/documents" className="inline-block mt-1.5 text-[10px] font-medium text-yellow-700 bg-white border border-yellow-300 px-2 py-1 rounded hover:bg-yellow-100">
                      Complete KYC →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* 2. Vehicle Documents */}
            {vehiclesWithPendingDocs.length > 0 && (
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-orange-800">Vehicle Documents Pending</p>
                    {vehiclesWithPendingDocs.slice(0, 2).map((v) => (
                      <p key={v.id} className="text-[10px] text-orange-600 mt-0.5">
                        {v.brand} {v.model} — {v.pendingDocCount} document(s)
                      </p>
                    ))}
                    <Link to="/owner/vehicle-documents" className="inline-block mt-1.5 text-[10px] font-medium text-orange-700 bg-white border border-orange-300 px-2 py-1 rounded hover:bg-orange-100">
                      Review →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* 3. Vehicle Pending Approval */}
            {pendingVehicles.length > 0 && (
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-800">{pendingVehicles.length} vehicle(s) pending approval</p>
                    <Link to="/owner/vehicles" className="inline-block mt-1.5 text-[10px] font-medium text-purple-700 bg-white border border-purple-300 px-2 py-1 rounded hover:bg-purple-100">
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* 4. Booking Payment Pending */}
            {pendingBookings.length > 0 && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-800">{pendingBookings.length} booking(s) await payment</p>
                    {pendingBookings.slice(0, 2).map((b) => (
                      <p key={b.id} className="text-[10px] text-blue-600 mt-0.5">
                        {b.brand} {b.model} — {formatCurrency(b.total_amount)}
                      </p>
                    ))}
                    <Link to="/owner/bookings" className="inline-block mt-1.5 text-[10px] font-medium text-blue-700 bg-white border border-blue-300 px-2 py-1 rounded hover:bg-blue-100">
                      View Bookings →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* 5. Payout Available */}
            {availableBalance > 0 && (
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Wallet className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-800">Payout Available</p>
                    <p className="text-[10px] text-green-600 mt-0.5">{formatCurrency(availableBalance)} ready</p>
                    <Link to="/owner/earnings" className="inline-block mt-1.5 text-[10px] font-medium text-green-700 bg-white border border-green-300 px-2 py-1 rounded hover:bg-green-100">
                      Withdraw →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* All Clear */}
            {totalPendingActions === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">✅ All caught up!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* RECENT RENTAL ORDERS */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Rental Orders</h3>
          <Link to="/owner/bookings" className="text-xs text-blue-600 hover:underline">View All</Link>
        </div>
        
        {bookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {booking.brand === booking.model ? booking.brand : `${booking.brand} ${booking.model}`}
                  </p>
                  <p className="text-[10px] text-slate-400">{booking.customer_name} • {formatDate(booking.pickup_date)}</p>
                </div>
                <span className="text-sm font-medium shrink-0">{formatCurrency(booking.total_amount)}</span>
                <StatusBadge status={booking.status} size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No bookings yet</p>
        )}
      </Card>
      
      {/* MY FLEET */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold">My Fleet</h3>
          <Link to="/owner/vehicles" className="text-xs text-blue-600 hover:underline">Manage Fleet</Link>
        </div>
        
        {vehicles.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {vehicles.slice(0, 5).map((vehicle) => (
              <div key={vehicle.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50">
                <Car className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {vehicle.brand === vehicle.model ? vehicle.brand : `${vehicle.brand} ${vehicle.model}`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatCurrency(vehicle.daily_rate)}/day • {vehicle.total_bookings || 0} bookings
                  </p>
                </div>
                <StatusBadge status={vehicle.status} size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6">
            <EmptyState
              title="No Vehicles Yet"
              description="Start earning by adding your first vehicle."
              action={
                <Link to="/owner/vehicles/new">
                  <Button size="sm"><Plus className="w-4 h-4" /> Add Vehicle</Button>
                </Link>
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default OwnerDashboard;
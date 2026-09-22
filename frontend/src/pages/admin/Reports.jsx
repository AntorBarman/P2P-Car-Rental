import { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  Calendar, 
  Car, 
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminReports = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchReportData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [statsRes, vehiclesRes, bookingsRes, paymentsRes, usersRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: null })),
        api.get('/admin/vehicles').catch(() => ({ data: { data: [] } })),
        api.get('/admin/bookings').catch(() => ({ data: { data: [] } })),
        api.get('/admin/payments').catch(() => ({ data: { data: [] } })),
        api.get('/admin/users').catch(() => ({ data: { data: [] } })),
      ]);
      
      setStats(statsRes.data || null);
      setVehicles(vehiclesRes.data?.data || vehiclesRes.data || []);
      setBookings(bookingsRes.data?.data || bookingsRes.data || []);
      setPayments(paymentsRes.data?.data || paymentsRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
    } catch (error) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);
  
  if (loading) {
    return (
      <div>
        <PageHeader title="Reports & Analytics" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <PageHeader title="Reports" />
        <ErrorState title="Failed" message={error} onRetry={fetchReportData} />
      </div>
    );
  }
  
  // ============ CALCULATIONS ============
  
  // Revenue Calculations
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const platformRevenue = totalRevenue * 0.15;
  const ownerEarnings = totalRevenue * 0.85;
  
  // Revenue by period
  const today = new Date().toISOString().split('T')[0];
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const weekStartStr = thisWeekStart.toISOString().split('T')[0];
  const thisMonthStart = new Date();
  thisMonthStart.setDate(thisMonthStart.getDate() - 30);
  const monthStartStr = thisMonthStart.toISOString().split('T')[0];
  
  const revenueToday = paidPayments.filter((p) => p.created_at?.split('T')[0] === today).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const revenueWeek = paidPayments.filter((p) => p.created_at?.split('T')[0] >= weekStartStr).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const revenueMonth = paidPayments.filter((p) => p.created_at?.split('T')[0] >= monthStartStr).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  
  // Booking Calculations
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');
  const pendingBookings = bookings.filter((b) => b.status === 'pending_payment' || b.status === 'confirmed');
  const ongoingBookings = bookings.filter((b) => b.status === 'ongoing');
  
  // Fleet Calculations
  const availableVehicles = vehicles.filter((v) => v.status === 'available' || v.status === 'approved');
  const bookedVehicles = vehicles.filter((v) => v.status === 'booked' || v.status === 'unavailable');
  const pendingVehicles = vehicles.filter((v) => v.status === 'pending');
  const suspendedVehicles = vehicles.filter((v) => v.status === 'suspended');
  const rejectedVehicles = vehicles.filter((v) => v.status === 'rejected');
  
  // User Calculations
  const customers = users.filter((u) => u.role === 'customer');
  const owners = users.filter((u) => u.role === 'owner');
  const activeUsers = users.filter((u) => u.is_active);
  const newThisWeek = users.filter((u) => u.created_at?.split('T')[0] >= weekStartStr);
  
  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Platform performance overview" />
      
      {/* ============ REVENUE SECTION ============ */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-green-600" />
          Revenue
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Today</p>
            <p className="text-sm font-bold mt-1">{formatCurrency(revenueToday)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">This Week</p>
            <p className="text-sm font-bold mt-1">{formatCurrency(revenueWeek)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">This Month</p>
            <p className="text-sm font-bold mt-1">{formatCurrency(revenueMonth)}</p>
          </Card>
          <Card className="p-3 text-center bg-green-50 border-green-200">
            <p className="text-[10px] text-green-600 uppercase">Platform (15%)</p>
            <p className="text-sm font-bold text-green-700 mt-1">{formatCurrency(platformRevenue)}</p>
          </Card>
          <Card className="p-3 text-center bg-purple-50 border-purple-200">
            <p className="text-[10px] text-purple-600 uppercase">Owner (85%)</p>
            <p className="text-sm font-bold text-purple-700 mt-1">{formatCurrency(ownerEarnings)}</p>
          </Card>
        </div>
      </div>
      
      {/* ============ BOOKINGS SECTION ============ */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Bookings
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Total</p>
            <p className="text-lg font-bold mt-1">{bookings.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-green-600 uppercase">Completed</p>
            <p className="text-lg font-bold text-green-700 mt-1">{completedBookings.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-yellow-600 uppercase">Pending</p>
            <p className="text-lg font-bold text-yellow-700 mt-1">{pendingBookings.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-red-600 uppercase">Cancelled</p>
            <p className="text-lg font-bold text-red-700 mt-1">{cancelledBookings.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-blue-600 uppercase">Ongoing</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{ongoingBookings.length}</p>
          </Card>
        </div>
      </div>
      
      {/* ============ FLEET SECTION ============ */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Car className="w-4 h-4 text-yellow-600" />
          Fleet
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Total</p>
            <p className="text-lg font-bold mt-1">{vehicles.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-green-600 uppercase">Available</p>
            <p className="text-lg font-bold text-green-700 mt-1">{availableVehicles.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-blue-600 uppercase">Booked</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{bookedVehicles.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-yellow-600 uppercase">Pending</p>
            <p className="text-lg font-bold text-yellow-700 mt-1">{pendingVehicles.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-red-600 uppercase">Suspended</p>
            <p className="text-lg font-bold text-red-700 mt-1">{suspendedVehicles.length + rejectedVehicles.length}</p>
          </Card>
        </div>
      </div>
      
      {/* ============ USERS SECTION ============ */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          Users
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-blue-600 uppercase">Customers</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{customers.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-green-600 uppercase">Owners</p>
            <p className="text-lg font-bold text-green-700 mt-1">{owners.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Active Users</p>
            <p className="text-lg font-bold mt-1">{activeUsers.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-purple-600 uppercase">New (7 days)</p>
            <p className="text-lg font-bold text-purple-700 mt-1">{newThisWeek.length}</p>
          </Card>
        </div>
      </div>
      
      {/* ============ REVENUE TREND (Simple Bar Chart) ============ */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Revenue Trend (Last 7 Days)
        </h2>
        
        <div className="flex items-end gap-2 h-28">
          {(() => {
            const days = [];
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              const revenue = paidPayments
                .filter((p) => p.created_at?.split('T')[0] === dateStr)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
              days.push({
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue,
              });
            }
            
            const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);
            
            return days.map((day) => (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-500">
                  {day.revenue > 0 ? `৳${(day.revenue / 1000).toFixed(1)}k` : ''}
                </span>
                <div
                  className="w-full bg-green-600 rounded-t"
                  style={{ height: `${(day.revenue / maxRevenue) * 70}px`, minHeight: day.revenue > 0 ? '4px' : '1px' }}
                />
                <span className="text-[9px] text-slate-400">{day.label}</span>
              </div>
            ));
          })()}
        </div>
      </Card>
    </div>
  );
};

export default AdminReports;
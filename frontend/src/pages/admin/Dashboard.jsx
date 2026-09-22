import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Car, 
  Calendar, 
  Wallet, 
  Shield,
  UserCheck,
  CarFront,
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Check,
  X,
  FileText,
  Activity,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import KpiCard from '../../components/admin/KpiCard';
import StatusBadge from '../../components/admin/StatusBadge';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import adminService from '../../services/adminService';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminDashboard = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      // Stats
      try { const res = await adminService.getStats(); setStats(res.data || res); } catch (e) {}
      
      // Pending Vehicles
      try { const res = await adminService.getPendingVehicles(); setPendingVehicles(res.data || []); } catch (e) {}
      
      // KYC + Vehicle Documents
      try {
        const res = await api.get('/admin/kyc');
        const allDocs = res.data.data || [];
        const identityDocs = allDocs.filter((d) => 
          ['nid', 'nid_front', 'nid_back', 'driving_license', 'driving_license_front', 'driving_license_back', 'face_photo'].includes(d.document_type)
        );
        const vehicleDocs = allDocs.filter((d) => 
          ['vehicle_rc', 'insurance', 'tax_token'].includes(d.document_type)
        );
        setPendingKYC(identityDocs.filter((d) => d.status === 'pending'));
        setPendingDocs(vehicleDocs.filter((d) => d.status === 'pending'));
      } catch (e) {}
      
      // Recent Bookings
      try {
        const res = await api.get('/admin/bookings');
        setRecentBookings((res.data.data || []).slice(0, 5));
      } catch (e) {}
      
    } catch (error) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  
  const handleQuickApprove = async (type, id) => {
    setActionLoading(`${type}-${id}`);
    try {
      if (type === 'vehicle') await adminService.approveVehicle(id);
      else await api.patch(`/admin/kyc/${id}/approve`);
      alert('Approved!');
      fetchDashboardData();
    } catch (e) {
      alert('Failed');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleQuickReject = async (type, id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setActionLoading(`${type}-${id}`);
    try {
      if (type === 'vehicle') await adminService.rejectVehicle(id, reason);
      else await api.patch(`/admin/kyc/${id}/reject`, { reason });
      alert('Rejected');
      fetchDashboardData();
    } catch (e) {
      alert('Failed');
    } finally {
      setActionLoading(null);
    }
  };
  
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState title="Failed" message={error} onRetry={fetchDashboardData} />;
  
  // ✅ All booking counts
  const allBookings = recentBookings;
  const pendingBookings = allBookings.filter((b) => b.status === 'pending_payment').length;
  const confirmedCount = allBookings.filter((b) => b.status === 'confirmed').length;
  const ongoingCount = allBookings.filter((b) => b.status === 'ongoing').length;
  const completedCount = allBookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = allBookings.filter((b) => b.status === 'cancelled').length;
  
  const totalPending = pendingKYC.length + pendingVehicles.length + pendingDocs.length;
  
  // Fleet utilization
  const totalVehicles = stats?.totalVehicles || 0;
  const fleetUtilization = totalVehicles > 0 ? 100 : 0; // Simplified
  
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Good morning, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-xs text-slate-500">Here's what's happening with UDrive today</p>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">{todayStr}</span>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Wallet} label="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} change={12.4} color="yellow" onClick={() => navigate('/admin/payments')} />
        <KpiCard icon={Calendar} label="Total Bookings" value={stats?.totalBookings || 0} change={15.2} color="purple" onClick={() => navigate('/admin/bookings')} />
        <KpiCard icon={Car} label="Active Vehicles" value={stats?.totalVehicles || 0} change={5.0} color="green" onClick={() => navigate('/admin/vehicles')} />
        <KpiCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} change={8.2} color="blue" onClick={() => navigate('/admin/users')} />
      </div>
      
      {/* Pending Banner */}
      {totalPending > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{totalPending} Pending Actions Require Attention</p>
            <p className="text-xs text-red-100">
              {pendingKYC.length} KYC • {pendingVehicles.length} Vehicles • {pendingDocs.length} Documents
            </p>
          </div>
        </div>
      )}
      
      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Revenue Overview
          </h3>
          <div className="flex items-end gap-2 h-28">
            {(() => {
              const days = [];
              for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const revenue = recentBookings
                  .filter((b) => b.created_at?.split('T')[0] === dateStr && b.status !== 'cancelled')
                  .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
                days.push({ label: date.toLocaleDateString('en-US', { weekday: 'short' }), revenue });
              }
              const maxRev = Math.max(...days.map((d) => d.revenue), 1);
              return days.map((day) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-500">{day.revenue > 0 ? `৳${(day.revenue / 1000).toFixed(1)}k` : ''}</span>
                  <div className="w-full bg-green-600 rounded-t" style={{ height: `${(day.revenue / maxRev) * 60}px`, minHeight: day.revenue > 0 ? '4px' : '1px' }} />
                  <span className="text-[9px] text-slate-400">{day.label}</span>
                </div>
              ));
            })()}
          </div>
        </Card>
        
        {/* Fleet Utilization */}
        <Card className="p-4 flex flex-col justify-center items-center">
          <h3 className="text-sm font-semibold mb-3 self-start">Fleet Utilization</h3>
          <div className="relative w-24 h-24 mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-green-600" 
              style={{ 
                clipPath: `polygon(0 0, ${fleetUtilization}% 0, ${fleetUtilization}% 100%, 0 100%)` 
              }} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-green-700">{fleetUtilization}%</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">{totalVehicles} vehicles in fleet</p>
        </Card>
      </div>
      
      {/* Booking Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3 text-center">
          <p className="text-[10px] text-yellow-600 uppercase">Pending</p>
          <p className="text-lg font-bold text-yellow-700">{pendingBookings}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[10px] text-green-600 uppercase">Confirmed</p>
          <p className="text-lg font-bold text-green-700">{confirmedCount}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[10px] text-blue-600 uppercase">Ongoing</p>
          <p className="text-lg font-bold text-blue-700">{ongoingCount}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Completed</p>
          <p className="text-lg font-bold text-slate-700">{completedCount}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[10px] text-red-600 uppercase">Cancelled</p>
          <p className="text-lg font-bold text-red-700">{cancelledCount}</p>
        </Card>
      </div>
      
      {/* Pending Actions - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* KYC Pending */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">KYC Reviews</span>
              <Badge variant="warning" size="xs">{pendingKYC.length}</Badge>
            </div>
            <Link to="/admin/kyc" className="text-[10px] text-blue-600 hover:underline">View All</Link>
          </div>
          {pendingKYC.length > 0 ? (
            <div className="max-h-40 overflow-y-auto">
              {pendingKYC.slice(0, 3).map((doc) => (
                <div key={doc.id} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50">
                  <Clock className="w-3 h-3 text-yellow-600 shrink-0" />
                  <span className="text-xs flex-1 truncate">{doc.user_name}</span>
                  <button onClick={() => handleQuickApprove('kyc', doc.id)} className="p-1 hover:bg-green-50 rounded" title="Approve">
                    <Check className="w-3 h-3 text-green-600" />
                  </button>
                  <button onClick={() => handleQuickReject('kyc', doc.id)} className="p-1 hover:bg-red-50 rounded" title="Reject">
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No pending KYC</p>
          )}
        </Card>
        
        {/* Vehicle Approvals */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CarFront className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-semibold">Vehicle Approvals</span>
              <Badge variant="warning" size="xs">{pendingVehicles.length}</Badge>
            </div>
            <Link to="/admin/vehicles" className="text-[10px] text-blue-600 hover:underline">View All</Link>
          </div>
          {pendingVehicles.length > 0 ? (
            <div className="max-h-40 overflow-y-auto">
              {pendingVehicles.slice(0, 3).map((v) => (
                <div key={v.id} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50">
                  <Car className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-xs flex-1 truncate">{v.brand} {v.model}</span>
                  <button onClick={() => handleQuickApprove('vehicle', v.id)} className="p-1 hover:bg-green-50 rounded" title="Approve">
                    <Check className="w-3 h-3 text-green-600" />
                  </button>
                  <button onClick={() => handleQuickReject('vehicle', v.id)} className="p-1 hover:bg-red-50 rounded" title="Reject">
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No pending vehicles</p>
          )}
        </Card>
        
        {/* Vehicle Documents */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold">Vehicle Documents</span>
              <Badge variant="warning" size="xs">{pendingDocs.length}</Badge>
            </div>
            <Link to="/admin/vehicle-documents" className="text-[10px] text-blue-600 hover:underline">View All</Link>
          </div>
          {pendingDocs.length > 0 ? (
            <div className="max-h-40 overflow-y-auto">
              {pendingDocs.slice(0, 3).map((doc) => (
                <div key={doc.id} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-xs flex-1 truncate">
                    {doc.user_name} - {doc.document_type?.replace(/_/g, ' ')}
                  </span>
                  <Link to="/admin/vehicle-documents" className="text-[10px] text-blue-600 hover:underline">Review</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No pending documents</p>
          )}
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card className="p-0 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100">
          <h3 className="text-xs font-semibold">Recent Activity</h3>
        </div>
        {recentBookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50">
                <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs flex-1 truncate">
                  <span className="font-medium">{booking.customer_name}</span> booked {booking.brand}
                </span>
                <span className="text-xs font-medium">{formatCurrency(booking.total_amount)}</span>
                <StatusBadge status={booking.status} size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-3">No recent activity</p>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
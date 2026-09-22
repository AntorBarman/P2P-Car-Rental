import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Car, 
  Plus,
  Eye,
  Edit,
  MoreVertical,
  TrendingUp,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import vehicleService from '../../services/vehicleService';
import bookingService from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatters';

const OwnerVehicles = () => {
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const [vehiclesRes, bookingsRes] = await Promise.all([
        vehicleService.getMyVehicles(),
        bookingService.getOwnerBookings(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (error) {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  // Add performance data to vehicles
  const vehiclesWithPerformance = vehicles.map((vehicle) => {
    const vehicleBookings = bookings.filter((b) => b.vehicle_id === vehicle.id);
    const completedBookings = vehicleBookings.filter((b) => b.status === 'completed' || b.status === 'confirmed');
    const revenue = completedBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const utilization = vehicle.total_bookings > 0
      ? Math.min(Math.round((vehicle.total_bookings / 30) * 100), 100)
      : 0;
    
    return {
      ...vehicle,
      bookingCount: vehicleBookings.length,
      revenue,
      utilization,
    };
  });
  
  // Filter
  const filteredVehicles = vehiclesWithPerformance.filter((vehicle) => {
    const searchStr = `${vehicle.brand} ${vehicle.model} ${vehicle.branch_name || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Sort
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'bookings') return b.bookingCount - a.bookingCount;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  
  const statusCounts = {
    all: vehicles.length,
    available: vehicles.filter((v) => v.status === 'approved' || v.status === 'available').length,
    booked: vehicles.filter((v) => v.status === 'booked' || v.status === 'unavailable').length,
    pending: vehicles.filter((v) => v.status === 'pending').length,
    suspended: vehicles.filter((v) => v.status === 'suspended').length,
  };
  
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <ErrorState title="Failed" message={error} onRetry={fetchData} />;
  
  return (
    <div>
      <PageHeader 
        title="My Vehicles" 
        description="Manage your fleet and track performance"
        actions={
          <Link to="/owner/vehicles/new">
            <Button size="sm"><Plus className="w-4 h-4" /> Add Vehicle</Button>
          </Link>
        }
      />
      
      {/* Status Tabs */}
      <div className="flex gap-1 mb-3 bg-white border border-slate-200 rounded-lg p-1 w-fit overflow-x-auto">
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          All ({statusCounts.all})
        </button>
        <button onClick={() => setStatusFilter('approved')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${statusFilter === 'approved' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          Available ({statusCounts.available})
        </button>
        <button onClick={() => setStatusFilter('booked')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${statusFilter === 'booked' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          Booked ({statusCounts.booked})
        </button>
        <button onClick={() => setStatusFilter('pending')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          Pending ({statusCounts.pending})
        </button>
      </div>
      
      {/* Search + Sort */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input placeholder="Search vehicle, branch..." icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="recent">Recent</option>
          <option value="revenue">Revenue</option>
          <option value="bookings">Bookings</option>
        </select>
      </div>
      
      {/* Vehicles Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Performance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50">
                  {/* Vehicle */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {vehicle.primary_image ? (
                        <img src={vehicle.primary_image} alt="" className="w-12 h-10 object-cover rounded-lg shrink-0" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium truncate">
                          {vehicle.brand === vehicle.model ? vehicle.brand : `${vehicle.brand} ${vehicle.model}`}
                        </p>
                        <p className="text-[10px] text-slate-400">{vehicle.year} • {vehicle.vehicle_type}</p>
                        <p className="text-[10px] text-slate-400">{vehicle.branch_name || 'No branch'}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Performance */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-600">{vehicle.bookingCount} bookings</p>
                      <p className="text-xs font-medium text-green-700">{formatCurrency(vehicle.revenue)}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 bg-slate-200 rounded-full h-1">
                          <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${vehicle.utilization}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{vehicle.utilization}%</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={vehicle.status} size="sm" />
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => navigate(`/owner/vehicles/${vehicle.id}`)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => navigate(`/owner/vehicles/${vehicle.id}/edit`)} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedVehicles.length === 0 && (
          <EmptyState title="No Vehicles" description="Add your first vehicle to start earning." icon={Car} action={<Link to="/owner/vehicles/new"><Button size="sm"><Plus className="w-4 h-4" /> Add Vehicle</Button></Link>} />
        )}
      </Card>
    </div>
  );
};

export default OwnerVehicles;
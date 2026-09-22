import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Car, 
  Plus,
  Eye,
  Check,
  X,
  Pause,
  FileText,
  Calendar,
  Filter,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import adminService from '../../services/adminService';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminVehicles = () => {
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  
  const fetchVehicles = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminService.getAllVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);
  
  const handleQuickApprove = async (vehicleId) => {
    if (!confirm('Approve this vehicle?')) return;
    setActionLoading(`approve-${vehicleId}`);
    try {
      await adminService.approveVehicle(vehicleId);
      alert('Vehicle approved');
      fetchVehicles();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleQuickReject = async (vehicleId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setActionLoading(`reject-${vehicleId}`);
    try {
      await adminService.rejectVehicle(vehicleId, reason);
      alert('Vehicle rejected');
      fetchVehicles();
    } catch (error) {
      alert('Failed');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleQuickSuspend = async (vehicleId) => {
    if (!confirm('Suspend this vehicle?')) return;
    setActionLoading(`suspend-${vehicleId}`);
    try {
      await adminService.suspendVehicle(vehicleId);
      alert('Vehicle suspended');
      fetchVehicles();
    } catch (error) {
      alert('Failed');
    } finally {
      setActionLoading(null);
    }
  };
  
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchStr = `${vehicle.brand} ${vehicle.model} ${vehicle.owner_name || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  if (loading) {
    return (
      <div>
        <PageHeader title="Vehicles" description="Manage fleet, approvals and availability" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <PageHeader title="Vehicles" description="Manage fleet" />
        <ErrorState title="Failed to Load" message={error} onRetry={fetchVehicles} />
      </div>
    );
  }
  
  const statusCounts = {
    all: vehicles.length,
    pending: vehicles.filter((v) => v.status === 'pending').length,
    approved: vehicles.filter((v) => v.status === 'approved' || v.status === 'available').length,
    suspended: vehicles.filter((v) => v.status === 'suspended').length,
    rejected: vehicles.filter((v) => v.status === 'rejected').length,
  };
  
  return (
    <div>
      <PageHeader 
        title="Vehicles" 
        description="Manage fleet, approvals and availability"
        actions={
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        }
      />
      
      {/* Filter Bar */}
      <Card className="p-3 mb-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search vehicles, owners..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="approved">Approved ({statusCounts.approved})</option>
            <option value="suspended">Suspended ({statusCounts.suspended})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
          </select>
        </div>
      </Card>
      
      {/* Vehicles Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submitted</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                  {/* Vehicle */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {vehicle.primary_image ? (
                        <img
                          src={vehicle.primary_image}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-12 h-10 object-cover rounded-lg shrink-0"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {vehicle.brand === vehicle.model ? vehicle.brand : `${vehicle.brand} ${vehicle.model}`}
                        </p>
                        <p className="text-xs text-slate-400">{vehicle.year} • {vehicle.vehicle_type}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Owner */}
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {vehicle.owner_name || 'N/A'}
                  </td>
                  
                  {/* Branch */}
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {vehicle.branch_name || 'N/A'}
                  </td>
                  
                  {/* Rate */}
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCurrency(vehicle.daily_rate)}
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={vehicle.status} size="sm" />
                  </td>
                  
                  {/* Submitted */}
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(vehicle.created_at)}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {/* View */}
                      <button
                        onClick={() => navigate(`/admin/vehicles/${vehicle.id}/review`)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      
                      {/* Documents */}
                      <button
                        onClick={() => navigate(`/admin/vehicles/${vehicle.id}/documents`)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg"
                        title="View Documents"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                      </button>
                      
                      {/* Booking History */}
                      <button
                        onClick={() => navigate(`/admin/vehicles/${vehicle.id}/bookings`)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg"
                        title="Booking History"
                      >
                        <Calendar className="w-4 h-4 text-slate-500" />
                      </button>
                      
                      {/* Approve (pending only) */}
                      {vehicle.status === 'pending' && (
                        <button
                          onClick={() => handleQuickApprove(vehicle.id)}
                          disabled={actionLoading === `approve-${vehicle.id}`}
                          className="p-1.5 hover:bg-green-50 rounded-lg"
                          title="Approve"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      
                      {/* Reject */}
                      {vehicle.status !== 'rejected' && vehicle.status !== 'approved' && (
                        <button
                          onClick={() => handleQuickReject(vehicle.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                      
                      {/* Suspend (approved only) */}
                      {(vehicle.status === 'approved' || vehicle.status === 'available') && (
                        <button
                          onClick={() => handleQuickSuspend(vehicle.id)}
                          className="p-1.5 hover:bg-orange-50 rounded-lg"
                          title="Suspend"
                        >
                          <Pause className="w-4 h-4 text-orange-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredVehicles.length === 0 && (
          <div className="py-12">
            <EmptyState
              title="No Vehicles Found"
              description="Try adjusting your filters."
              icon={Car}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminVehicles;
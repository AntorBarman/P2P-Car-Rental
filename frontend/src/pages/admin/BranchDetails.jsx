import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  MapPin,
  Car,
  Calendar,
  Wallet,
  Pause,
  CheckCircle,
  Edit,
  X,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import StatusBadge from '../../components/admin/StatusBadge';
import branchService from '../../services/branchService';
import { formatCurrency } from '../../utils/formatters';

const BranchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    district: '',
    address: '',
    phone: '',
    email: '',
    opening_time: '',
    closing_time: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  // Suspend modal state
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  
  useEffect(() => {
    if (accessToken && id) {
      fetchBranchDetails();
    }
  }, [accessToken, id]);
  
  const fetchBranchDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await branchService.getById(id);
      const branchData = response.data || response;
      setBranch(branchData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };
  
  const openEditModal = () => {
    setEditForm({
      name: branch?.name || '',
      city: branch?.city || '',
      district: branch?.district || '',
      address: branch?.address || '',
      phone: branch?.phone || '',
      email: branch?.email || '',
      opening_time: branch?.opening_time?.slice(0, 5) || '08:00',
      closing_time: branch?.closing_time?.slice(0, 5) || '20:00',
    });
    setEditError('');
    setEditModalOpen(true);
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    
    try {
      await branchService.update(id, editForm);
      alert('Branch updated successfully!');
      setEditModalOpen(false);
      fetchBranchDetails();
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update branch');
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide suspension reason');
      return;
    }
    
    setActionLoading(true);
    try {
      await branchService.suspend(id, suspendReason);
      alert('Branch suspended');
      setSuspendModalOpen(false);
      setSuspendReason('');
      fetchBranchDetails();
    } catch (error) {
      alert('Failed to suspend');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleActivate = async () => {
    if (!confirm('Activate this branch?')) return;
    
    setActionLoading(true);
    try {
      await branchService.activate(id);
      alert('Branch activated');
      fetchBranchDetails();
    } catch (error) {
      alert('Failed to activate');
    } finally {
      setActionLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <ErrorState title="Failed" message={error} onRetry={fetchBranchDetails} />;
  }
  
  if (!branch) {
    return <div className="text-center py-16">Branch not found</div>;
  }
  
  const vehicles = branch.vehicles || [];
  const availableVehicles = vehicles.filter((v) => v.status === 'available' || v.status === 'approved');
  const totalRevenue = vehicles.reduce((sum, v) => sum + Number(v.total_revenue || 0), 0);
  
  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/admin/branches')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to Branches
      </button>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{branch.name}</h1>
            <StatusBadge status={branch.is_active ? 'active' : 'suspended'} size="sm" />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {branch.code} • {branch.city}
          </p>
          <p className="text-xs text-slate-400">{branch.address}</p>
        </div>
        
        <div className="flex gap-2 mt-3 sm:mt-0">
          <Button size="sm" variant="outline" onClick={openEditModal}>
            <Edit className="w-4 h-4" /> Edit Branch
          </Button>
          {branch.is_active ? (
            <Button size="sm" variant="danger" onClick={() => setSuspendModalOpen(true)}>
              <Pause className="w-4 h-4" /> Suspend
            </Button>
          ) : (
            <Button size="sm" variant="success" onClick={handleActivate}>
              <CheckCircle className="w-4 h-4" /> Activate
            </Button>
          )}
        </div>
      </div>
      
      {/* Suspension Reason Display */}
      {branch.suspension_reason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            <strong>Suspension Reason:</strong> {branch.suspension_reason}
          </p>
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card className="p-4">
          <Car className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Vehicles</p>
          <p className="text-xl font-bold">{vehicles.length}</p>
        </Card>
        <Card className="p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-xs text-slate-500">Available</p>
          <p className="text-xl font-bold text-green-700">{availableVehicles.length}</p>
        </Card>
        <Card className="p-4">
          <Calendar className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-xs text-slate-500">Bookings</p>
          <p className="text-xl font-bold">{branch.active_booking_count || 0}</p>
        </Card>
        <Card className="p-4">
          <Wallet className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>
      
      {/* Branch Info */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold mb-3">Branch Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Code:</span> <span className="font-mono">{branch.code}</span></div>
          <div><span className="text-slate-500">Phone:</span> {branch.phone || 'Not provided'}</div>
          <div><span className="text-slate-500">Email:</span> {branch.email || 'Not provided'}</div>
          <div>
            <span className="text-slate-500">Hours:</span>{' '}
            {branch.opening_time?.slice(0, 5)} – {branch.closing_time?.slice(0, 5)}
          </div>
        </div>
      </Card>
      
      {/* Vehicles at Branch */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold">Vehicles at {branch.name}</h2>
        </div>
        
        {vehicles.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Vehicle</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Rate</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm font-medium">
                    {vehicle.brand === vehicle.model ? vehicle.brand : `${vehicle.brand} ${vehicle.model}`}
                    <span className="text-xs text-slate-400 ml-1">{vehicle.year}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">{formatCurrency(vehicle.daily_rate)}</td>
                  <td className="px-4 py-2"><StatusBadge status={vehicle.status} size="xs" /></td>
                  <td className="px-4 py-2 text-xs text-slate-500">{vehicle.owner_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No vehicles at this branch</p>
        )}
      </Card>
      
      {/* ============ EDIT BRANCH MODAL ============ */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Edit Branch</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
                {editError}
              </div>
            )}
            
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Branch Name *"
                  name="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
                <Input
                  label="City *"
                  name="city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  required
                />
                <Input
                  label="District"
                  name="district"
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                />
                <Input
                  label="Phone *"
                  name="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                />
              </div>
              
              <Input
                label="Address *"
                name="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                required
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Opening Time"
                  name="opening_time"
                  type="time"
                  value={editForm.opening_time}
                  onChange={(e) => setEditForm({ ...editForm, opening_time: e.target.value })}
                />
                <Input
                  label="Closing Time"
                  name="closing_time"
                  type="time"
                  value={editForm.closing_time}
                  onChange={(e) => setEditForm({ ...editForm, closing_time: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" fullWidth type="button" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" fullWidth type="submit" isLoading={editLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* ============ SUSPEND MODAL ============ */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSuspendModalOpen(false)} />
          <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-sm mb-2">Suspend {branch.name}</h3>
            <textarea
              rows="3"
              placeholder="Suspension reason..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mb-3"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" fullWidth onClick={() => setSuspendModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" fullWidth onClick={handleSuspend} isLoading={actionLoading}>
                Suspend
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchDetails;
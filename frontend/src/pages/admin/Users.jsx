import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  User, 
  Eye,
  Ban,
  CheckCircle,
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
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // ✅ Read role from URL
  useEffect(() => {
    const role = searchParams.get('role');
    if (role) {
      setRoleFilter(role);
    } else {
      setRoleFilter('all');
    }
  }, [searchParams]);
  
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const fetchUserDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const [bookingsRes, kycRes] = await Promise.all([
        api.get(`/admin/users/${userId}/bookings`).catch(() => ({ data: { data: [] } })),
        api.get('/admin/kyc').catch(() => ({ data: { data: [] } })),
      ]);
      
      const userKyc = (kycRes.data.data || []).filter((d) => d.user_id === userId);
      
      setUserDetails({
        bookings: bookingsRes.data?.data || bookingsRes.data || [],
        kyc: userKyc,
        kycStatus: userKyc.length > 0 
          ? (userKyc.some((d) => d.status === 'approved') ? 'verified' : 'pending') 
          : 'none',
      });
    } catch (error) {
      setUserDetails({ bookings: [], kyc: [], kycStatus: 'none' });
    } finally {
      setDetailsLoading(false);
    }
  };
  
  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };
  
  const handleSuspend = async (userId) => {
    if (!confirm('Suspend this user?')) return;
    setActionLoading(`suspend-${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      alert('User suspended');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      alert('Failed to suspend');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleActivate = async (userId) => {
    if (!confirm('Activate this user?')) return;
    setActionLoading(`activate-${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/activate`);
      alert('User activated');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      alert('Failed to activate');
    } finally {
      setActionLoading(null);
    }
  };
  
  const getRoleVariant = (role) => {
    const variants = { admin: 'danger', staff: 'warning', owner: 'success', customer: 'primary' };
    return variants[role] || 'default';
  };
  
  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  
  const roleCounts = {
    all: users.length,
    customer: users.filter((u) => u.role === 'customer').length,
    owner: users.filter((u) => u.role === 'owner').length,
    staff: users.filter((u) => u.role === 'staff' || u.role === 'admin').length,
  };
  
  if (loading) {
    return (
      <div>
        <PageHeader title="User Management" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <PageHeader title="User Management" />
        <ErrorState title="Failed" message={error} onRetry={fetchUsers} />
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title={roleFilter === 'all' ? 'User Management' : roleFilter === 'customer' ? 'Customers' : roleFilter === 'owner' ? 'Vehicle Owners' : 'Staff'} 
        description={`${roleCounts[roleFilter] || roleCounts.all} users`} 
      />
      
      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            navigate(`/admin/users?role=${e.target.value}`);
          }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Roles ({roleCounts.all})</option>
          <option value="customer">Customers ({roleCounts.customer})</option>
          <option value="owner">Owners ({roleCounts.owner})</option>
          <option value="staff">Staff ({roleCounts.staff})</option>
        </select>
      </div>
      
      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold">{user.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[150px]">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getRoleVariant(user.role)} size="sm">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.is_active ? 'active' : 'suspended'} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleUserClick(user)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      {user.is_active ? (
                        <button onClick={() => handleSuspend(user.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Suspend">
                          <Ban className="w-4 h-4 text-red-600" />
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(user.id)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Activate">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="py-10">
            <EmptyState title="No Users Found" icon={User} />
          </div>
        )}
      </Card>
      
      {/* User Details Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUser(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-96 max-w-[90%] bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">User Profile</h3>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-slate-100 rounded">✕</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">{selectedUser.name?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">KYC</p>
                  <StatusBadge status={userDetails?.kycStatus === 'verified' ? 'approved' : 'pending'} size="xs" className="mt-1" />
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Bookings</p>
                  <p className="text-lg font-bold">{userDetails?.bookings?.length || 0}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {selectedUser.is_active ? (
                  <Button variant="danger" size="sm" fullWidth onClick={() => handleSuspend(selectedUser.id)}>
                    <Ban className="w-4 h-4" /> Suspend
                  </Button>
                ) : (
                  <Button variant="success" size="sm" fullWidth onClick={() => handleActivate(selectedUser.id)}>
                    <CheckCircle className="w-4 h-4" /> Activate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
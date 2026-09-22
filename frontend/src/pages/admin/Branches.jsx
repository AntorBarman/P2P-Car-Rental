import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    MapPin,
    Car,
    Calendar,
    Eye,
    Pause,
    CheckCircle,
    Plus,
    X,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import branchService from '../../services/branchService';

const AdminBranches = () => {
    const navigate = useNavigate();
    const { accessToken } = useSelector((state) => state.auth);

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Add Branch Modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        code: '',
        city: '',
        district: '',
        address: '',
        phone: '',
        email: '',
        opening_time: '08:00',
        closing_time: '20:00',
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');

    // Suspend Modal
    const [suspendModal, setSuspendModal] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');

    const fetchBranches = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);

        try {
            const response = await branchService.getAllAdmin();
            console.log('🔍 Branch API response:', response);

            // ✅ Handle both response formats
            const responseData = response.data || response;

            if (Array.isArray(responseData)) {
                setBranches(responseData);
            } else if (responseData && Array.isArray(responseData.branches)) {
                setBranches(responseData.branches);
            } else if (responseData && typeof responseData === 'object') {
                // Maybe branches are in data.data
                const nested = responseData.data;
                if (Array.isArray(nested)) {
                    setBranches(nested);
                } else if (nested && Array.isArray(nested.branches)) {
                    setBranches(nested.branches);
                } else {
                    setBranches([]);
                }
            } else {
                setBranches([]);
            }
        } catch (error) {
            console.error('❌ Fetch branches error:', error);
            setError(error.response?.data?.message || 'Failed to load branches');
            setBranches([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleAddBranch = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError('');

        try {
            await branchService.create(addForm);
            alert('Branch created successfully!');
            setAddModalOpen(false);
            setAddForm({
                name: '', code: '', city: '', district: '', address: '', phone: '', email: '',
                opening_time: '08:00', closing_time: '20:00',
            });
            fetchBranches();
        } catch (error) {
            setAddError(error.response?.data?.message || 'Failed to create branch');
        } finally {
            setAddLoading(false);
        }
    };

    const handleSuspend = async (branchId) => {
        if (!suspendReason.trim()) {
            alert('Please provide suspension reason');
            return;
        }

        setActionLoading(`suspend-${branchId}`);
        try {
            await branchService.suspend(branchId, suspendReason);
            alert('Branch suspended');
            setSuspendModal(null);
            setSuspendReason('');
            fetchBranches();
        } catch (error) {
            alert('Failed to suspend');
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivate = async (branchId) => {
        if (!confirm('Activate this branch?')) return;
        setActionLoading(`activate-${branchId}`);
        try {
            await branchService.activate(branchId);
            alert('Branch activated');
            fetchBranches();
        } catch (error) {
            alert('Failed to activate');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredBranches = branches.filter((branch) => {
        const searchStr = `${branch.name || ''} ${branch.code || ''} ${branch.city || ''}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const activeBranches = branches.filter((b) => b.is_active);
    const suspendedBranches = branches.filter((b) => !b.is_active);

    if (loading) {
        return (
            <div>
                <PageHeader title="Branch Management" />
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <PageHeader title="Branch Management" />
                <ErrorState title="Failed" message={error} onRetry={fetchBranches} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Branch Management"
                description="Manage UDrive pickup and return locations"
                actions={
                    <Button size="sm" onClick={() => setAddModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Add Branch
                    </Button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Card className="p-3">
                    <p className="text-[10px] text-slate-500 uppercase">Total Branches</p>
                    <p className="text-lg font-bold">{branches.length}</p>
                </Card>
                <Card className="p-3">
                    <p className="text-[10px] text-green-600 uppercase">Active</p>
                    <p className="text-lg font-bold text-green-700">{activeBranches.length}</p>
                </Card>
                <Card className="p-3">
                    <p className="text-[10px] text-red-600 uppercase">Suspended</p>
                    <p className="text-lg font-bold text-red-700">{suspendedBranches.length}</p>
                </Card>
                <Card className="p-3">
                    <p className="text-[10px] text-blue-600 uppercase">Total Vehicles</p>
                    <p className="text-lg font-bold text-blue-700">
                        {branches.reduce((sum, b) => sum + Number(b.vehicle_count || 0), 0)}
                    </p>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-3">
                <Input
                    placeholder="Search by name, code, city..."
                    icon={Search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Branch Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Branch</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicles</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bookings</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredBranches.map((branch) => (
                                <tr key={branch.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{branch.name}</p>
                                                <p className="text-[10px] text-slate-400">{branch.address?.slice(0, 25)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                                            {branch.code || 'NO-CODE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{branch.city}</td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1 text-sm text-slate-600">
                                            <Car className="w-3.5 h-3.5 text-slate-400" />
                                            {branch.vehicle_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1 text-sm text-slate-600">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {branch.active_booking_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={branch.is_active ? 'active' : 'suspended'} size="sm" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => navigate(`/admin/branches/${branch.id}`)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="View Details">
                                                <Eye className="w-4 h-4 text-blue-600" />
                                            </button>
                                            {branch.is_active ? (
                                                <button onClick={() => setSuspendModal(branch)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Suspend">
                                                    <Pause className="w-4 h-4 text-red-600" />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleActivate(branch.id)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Activate">
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

                {filteredBranches.length === 0 && (
                    <div className="py-10">
                        <EmptyState title="No Branches Found" icon={MapPin} />
                    </div>
                )}
            </Card>

            {/* ============ ADD BRANCH MODAL ============ */}
            {addModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setAddModalOpen(false)} />

                    <div className="relative bg-white rounded-xl p-5 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Add New Branch</h3>
                            <button onClick={() => setAddModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {addError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
                                {addError}
                            </div>
                        )}

                        <form onSubmit={handleAddBranch} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Branch Name *"
                                    name="name"
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    placeholder="e.g., UDrive Dhanmondi"
                                    required
                                />
                                <Input
                                    label="Branch Code *"
                                    name="code"
                                    value={addForm.code}
                                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., DHANMONDI-DHK"
                                    required
                                />
                                <Input
                                    label="City *"
                                    name="city"
                                    value={addForm.city}
                                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                                    placeholder="e.g., Dhaka"
                                    required
                                />
                                <Input
                                    label="District"
                                    name="district"
                                    value={addForm.district}
                                    onChange={(e) => setAddForm({ ...addForm, district: e.target.value })}
                                    placeholder="e.g., Dhaka"
                                />
                            </div>

                            <Input
                                label="Address *"
                                name="address"
                                value={addForm.address}
                                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                                placeholder="e.g., House 10, Road 5, Dhanmondi"
                                required
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Phone *"
                                    name="phone"
                                    value={addForm.phone}
                                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                                    placeholder="+8801XXXXXXXXX"
                                    required
                                />
                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={addForm.email}
                                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                    placeholder="branch@udrivebd.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Opening Time"
                                    name="opening_time"
                                    type="time"
                                    value={addForm.opening_time}
                                    onChange={(e) => setAddForm({ ...addForm, opening_time: e.target.value })}
                                />
                                <Input
                                    label="Closing Time"
                                    name="closing_time"
                                    type="time"
                                    value={addForm.closing_time}
                                    onChange={(e) => setAddForm({ ...addForm, closing_time: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" fullWidth type="button" onClick={() => setAddModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button size="sm" fullWidth type="submit" isLoading={addLoading}>
                                    Create Branch
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Suspend Modal */}
            {suspendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSuspendModal(null)} />
                    <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
                        <h3 className="font-semibold text-sm mb-2">Suspend {suspendModal.name}</h3>
                        <textarea
                            rows="3"
                            placeholder="Suspension reason..."
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mb-3"
                        />
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" fullWidth onClick={() => setSuspendModal(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" fullWidth onClick={() => handleSuspend(suspendModal.id)}>
                                Suspend
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBranches;
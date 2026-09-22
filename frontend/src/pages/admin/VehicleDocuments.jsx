import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Car,
  Eye,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  User,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

const VehicleDocuments = () => {
  const { accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Document action states
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const fetchVehicles = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/admin/vehicles/documents');
      const data = response.data.data || [];
      setVehicles(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
      setError('Failed to load vehicle documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    toast.success('Refreshed');
  };

  // ✅ Handle Document Approve
  const handleApproveDocument = async (vehicleId, docId) => {
    setActionLoading(prev => ({ ...prev, [docId]: true }));
    
    try {
      await api.patch(`/admin/documents/${docId}/approve`);
      toast.success('Document approved successfully!');
      await fetchVehicles(); // Refresh the list
    } catch (error) {
      console.error('❌ Approval failed:', error);
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  // ✅ Handle Document Reject
  const handleRejectDocument = async () => {
    if (!rejectModal) return;
    
    const { docId } = rejectModal;
    if (!rejectReason.trim()) {
      toast.warning('Please provide rejection reason');
      return;
    }

    setActionLoading(prev => ({ ...prev, [docId]: true }));
    
    try {
      await api.patch(`/admin/documents/${docId}/reject`, { reason: rejectReason });
      toast.success('Document rejected');
      setRejectModal(null);
      setRejectReason('');
      await fetchVehicles();
    } catch (error) {
      console.error('❌ Rejection failed:', error);
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [docId]: false }));
    }
  };
  
  // ✅ Get document status for a vehicle
  const getDocStatus = (vehicle, type) => {
    if (!vehicle.documents) return 'missing';
    const doc = vehicle.documents.find(d => d.type === type);
    return doc ? doc.status : 'missing';
  };
  
  // ✅ Get document object
  const getDocObject = (vehicle, type) => {
    if (!vehicle.documents) return null;
    return vehicle.documents.find(d => d.type === type) || null;
  };
  
  // ✅ Get overall status badge
  const getOverallBadge = (status) => {
    const configs = {
      verified: { label: '✅ Verified', variant: 'success' },
      under_review: { label: '🟡 Under Review', variant: 'warning' },
      pending_review: { label: '🟡 Pending Review', variant: 'warning' },
      incomplete: { label: '🔴 Incomplete', variant: 'danger' },
      rejected: { label: '🔴 Rejected', variant: 'danger' },
      draft: { label: '⚪ Draft', variant: 'secondary' },
    };
    const config = configs[status] || configs.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  // ✅ Get document status icon
  const getDocIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };
  
  // ✅ Get document label
  const getDocumentLabel = (type) => {
    const labels = {
      'vehicle_rc': 'Registration',
      'insurance': 'Insurance',
      'tax_token': 'Tax Token',
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  };
  
  // ✅ Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchStr = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.owner_name || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Stats
  const total = vehicles.length;
  const verified = vehicles.filter(v => v.overallStatus === 'verified').length;
  const underReview = vehicles.filter(v => v.overallStatus === 'under_review' || v.overallStatus === 'pending_review').length;
  const blocked = vehicles.filter(v => v.overallStatus === 'incomplete' || v.overallStatus === 'rejected').length;
  
  if (loading) {
    return (
      <div>
        <PageHeader title="Vehicle Documents" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <PageHeader title="Vehicle Documents" />
        <ErrorState title="Failed" message={error} onRetry={fetchVehicles} />
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title="Vehicle Documents" 
        description="Review and verify vehicle legal documents"
        action={
          <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-[10px] text-slate-500 uppercase">Total Vehicles</p>
        </Card>
        <Card className="p-3 text-center border-green-200 bg-green-50">
          <p className="text-2xl font-bold text-green-600">{verified}</p>
          <p className="text-[10px] text-green-600 uppercase">Verified</p>
        </Card>
        <Card className="p-3 text-center border-yellow-200 bg-yellow-50">
          <p className="text-2xl font-bold text-yellow-600">{underReview}</p>
          <p className="text-[10px] text-yellow-600 uppercase">Under Review</p>
        </Card>
        <Card className="p-3 text-center border-red-200 bg-red-50">
          <p className="text-2xl font-bold text-red-600">{blocked}</p>
          <p className="text-[10px] text-red-600 uppercase">Blocked</p>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by vehicle, owner..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="verified">✅ Verified</option>
          <option value="under_review">🟡 Under Review</option>
          <option value="incomplete">🔴 Blocked</option>
        </select>
      </div>
      
      {/* Vehicle Cards - With Approve/Reject Buttons */}
      <div className="space-y-4">
        {filteredVehicles.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Vehicles Found</h3>
            <p className="text-slate-500 text-sm">No vehicles match your filters</p>
          </Card>
        ) : (
          filteredVehicles.map((vehicle) => {
            const docStatus = {
              rc: getDocStatus(vehicle, 'vehicle_rc'),
              insurance: getDocStatus(vehicle, 'insurance'),
              tax: getDocStatus(vehicle, 'tax_token'),
            };
            
            const allApproved = docStatus.rc === 'approved' && 
                              docStatus.insurance === 'approved' && 
                              docStatus.tax === 'approved';
            
            return (
              <Card key={vehicle.vehicle_id} className="p-4 hover:shadow-md transition-shadow">
                {/* Vehicle Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Car className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-slate-500">{vehicle.year}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{vehicle.owner_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getOverallBadge(vehicle.overallStatus)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/admin/vehicles/${vehicle.vehicle_id}/review`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Full Review
                    </Button>
                  </div>
                </div>
                
                {/* ✅ Document Status Row WITH Approve/Reject Buttons */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* RC */}
                  <DocumentCard
                    label="Registration"
                    status={docStatus.rc}
                    doc={getDocObject(vehicle, 'vehicle_rc')}
                    vehicleId={vehicle.vehicle_id}
                    actionLoading={actionLoading}
                    onApprove={handleApproveDocument}
                    onRejectOpen={(docId) => setRejectModal({ docId, vehicleId: vehicle.vehicle_id })}
                    icon={getDocIcon(docStatus.rc)}
                  />
                  
                  {/* Insurance */}
                  <DocumentCard
                    label="Insurance"
                    status={docStatus.insurance}
                    doc={getDocObject(vehicle, 'insurance')}
                    vehicleId={vehicle.vehicle_id}
                    actionLoading={actionLoading}
                    onApprove={handleApproveDocument}
                    onRejectOpen={(docId) => setRejectModal({ docId, vehicleId: vehicle.vehicle_id })}
                    icon={getDocIcon(docStatus.insurance)}
                  />
                  
                  {/* Tax Token */}
                  <DocumentCard
                    label="Tax Token"
                    status={docStatus.tax}
                    doc={getDocObject(vehicle, 'tax_token')}
                    vehicleId={vehicle.vehicle_id}
                    actionLoading={actionLoading}
                    onApprove={handleApproveDocument}
                    onRejectOpen={(docId) => setRejectModal({ docId, vehicleId: vehicle.vehicle_id })}
                    icon={getDocIcon(docStatus.tax)}
                  />
                </div>
                
                {/* Missing Documents Warning */}
                {!allApproved && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {docStatus.rc !== 'approved' && 'Registration '}
                      {docStatus.insurance !== 'approved' && 'Insurance '}
                      {docStatus.tax !== 'approved' && 'Tax Token '}
                      {!allApproved && '— pending or missing'}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ✅ Document Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setRejectModal(null);
            setRejectReason('');
          }} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">Reject Document</h3>
            <p className="text-sm text-slate-500 mb-4">Provide a reason for rejecting this document</p>
            <textarea
              rows="4"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm mb-4"
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                onClick={handleRejectDocument}
                isLoading={actionLoading[rejectModal?.docId]}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Document Card Component with Approve/Reject Buttons
const DocumentCard = ({ label, status, doc, vehicleId, actionLoading, onApprove, onRejectOpen, icon }) => {
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isMissing = status === 'missing';
  
  return (
    <div className={`p-3 rounded-lg border ${
      isApproved ? 'bg-green-50 border-green-200' :
      isPending ? 'bg-yellow-50 border-yellow-200' :
      'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <Badge variant={
          isApproved ? 'success' :
          isPending ? 'warning' :
          'danger'
        } size="sm">
          {isApproved ? 'Verified' :
           isPending ? 'Pending' :
           'Missing'}
        </Badge>
      </div>
      
      {/* ✅ Approve/Reject Buttons for Pending Documents */}
      {isPending && doc && (
        <div className="flex gap-2 mt-2">
          <Button 
            size="sm" 
            variant="success"
            className="flex-1 text-xs"
            onClick={() => onApprove(vehicleId, doc.id)}
            isLoading={actionLoading[doc.id]}
          >
            <Check className="w-3 h-3 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="danger"
            className="flex-1 text-xs"
            onClick={() => onRejectOpen(doc.id)}
            isLoading={actionLoading[doc.id]}
          >
            <X className="w-3 h-3 mr-1" />
            Reject
          </Button>
        </div>
      )}
      
      {/* View Button for Approved Documents */}
      {isApproved && doc?.document_url && (
        <Button 
          size="sm" 
          variant="outline"
          className="w-full mt-2 text-xs"
          onClick={() => window.open(doc.document_url, '_blank')}
        >
          <Eye className="w-3 h-3 mr-1" />
          View Document
        </Button>
      )}
      
      {/* Upload Button for Missing Documents */}
      {isMissing && (
        <Button 
          size="sm" 
          variant="outline"
          className="w-full mt-2 text-xs text-red-600 border-red-300 hover:bg-red-50"
          disabled
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Uploaded
        </Button>
      )}
    </div>
  );
};

export default VehicleDocuments;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  User,
  Car,
  ChevronLeft,
  Camera,
  Check,
  X,
  Clock,
  Eye,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import adminService from '../../services/adminService';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

const VehicleReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useSelector((state) => state.auth);
  
  const [vehicle, setVehicle] = useState(null);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // ✅ Document review states
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docReviewAction, setDocReviewAction] = useState(null);
  const [docRejectReason, setDocRejectReason] = useState('');
  const [docActionLoading, setDocActionLoading] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    if (accessToken && id) {
      fetchVehicleData();
    }
  }, [accessToken, id]);

  const fetchVehicleData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch vehicle details
      const vehicleResponse = await api.get(`/vehicles/${id}`);
      const vehicleData = vehicleResponse.data.data || vehicleResponse.data;
      setVehicle(vehicleData);

      // Fetch vehicle images
      if (vehicleData.images) {
        setVehicleImages(vehicleData.images);
      }

      // ✅ Fetch documents for this vehicle
      const docsResponse = await api.get(`/admin/documents`);
      const allDocs = docsResponse.data.data || [];
      
      const requiredTypes = ['vehicle_rc', 'insurance', 'tax_token'];
      const vehicleDocs = allDocs.filter((d) => 
        d.vehicle_id === id && 
        requiredTypes.includes(d.document_type) &&
        d.is_active !== false
      );

      // Group by type and take latest
      const groupedDocs = {};
      vehicleDocs.forEach(doc => {
        const key = doc.document_type;
        if (!groupedDocs[key] || new Date(doc.created_at) > new Date(groupedDocs[key].created_at)) {
          groupedDocs[key] = doc;
        }
      });

      setVehicleDocuments(Object.values(groupedDocs));
      
      console.log('✅ Vehicle data loaded');
      console.log('📄 Documents:', Object.values(groupedDocs));

    } catch (error) {
      console.error('❌ Failed to fetch vehicle:', error);
      setError(error.response?.data?.message || 'Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Document Approve Handler
  const handleDocApprove = async (docId) => {
    setDocActionLoading(true);
    try {
      await api.patch(`/admin/documents/${docId}/approve`);
      toast.success('Document approved successfully!');
      setShowDocModal(false);
      setSelectedDoc(null);
      fetchVehicleData();
    } catch (error) {
      console.error('❌ Approval failed:', error);
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setDocActionLoading(false);
    }
  };

  // ✅ Document Reject Handler
  const handleDocReject = async () => {
    if (!docRejectReason.trim()) {
      toast.warning('Please provide rejection reason');
      return;
    }

    setDocActionLoading(true);
    try {
      await api.patch(`/admin/documents/${selectedDoc.id}/reject`, { reason: docRejectReason });
      toast.success('Document rejected');
      setShowDocModal(false);
      setSelectedDoc(null);
      setDocRejectReason('');
      fetchVehicleData();
    } catch (error) {
      console.error('❌ Rejection failed:', error);
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setDocActionLoading(false);
    }
  };

  // Vehicle Approve/Reject Handlers
  const handleApprove = async () => {
    if (!confirm('Approve this vehicle? It will be visible to customers.')) return;

    setActionLoading(true);
    try {
      await adminService.approveVehicle(id);
      toast.success('Vehicle approved successfully!');
      navigate('/admin/vehicles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.rejectVehicle(id, rejectReason);
      toast.success('Vehicle rejected');
      navigate('/admin/vehicles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Suspend this vehicle?')) return;

    setActionLoading(true);
    try {
      await adminService.suspendVehicle(id);
      toast.success('Vehicle suspended');
      navigate('/admin/vehicles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suspension failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getDocStatusConfig = (status) => {
    const configs = {
      approved: { variant: 'success', icon: CheckCircle, label: 'Verified' },
      pending: { variant: 'warning', icon: Clock, label: 'Pending' },
      rejected: { variant: 'danger', icon: XCircle, label: 'Rejected' },
    };
    return configs[status] || configs.pending;
  };

  const getDocumentLabel = (type) => {
    const labels = {
      'vehicle_rc': 'Registration Certificate',
      'insurance': 'Insurance',
      'tax_token': 'Tax Token',
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <ErrorState title="Failed to Load Vehicle" message={error} onRetry={fetchVehicleData} />;
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Vehicle Not Found</h2>
        <button onClick={() => navigate('/admin/vehicles')} className="text-blue-600 hover:underline">
          ← Back
        </button>
      </div>
    );
  }

  const requiredTypes = ['vehicle_rc', 'insurance', 'tax_token'];
  const uploadedTypes = vehicleDocuments.map(d => d.document_type);
  const allUploaded = requiredTypes.every(type => uploadedTypes.includes(type));
  const allVerified = vehicleDocuments.every(d => d.status === 'approved' || d.status === 'verified');

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/admin/vehicles')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to Vehicles
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Vehicle Review</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info */}
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Brand</p>
                <p className="font-medium">{vehicle.brand}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Model</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Year</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Type</p>
                <p className="font-medium capitalize">{vehicle.vehicle_type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Daily Rate</p>
                <p className="font-medium">৳{Number(vehicle.daily_rate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge variant={vehicle.status === 'approved' ? 'success' : vehicle.status === 'pending' ? 'warning' : 'danger'}>
                  {vehicle.status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Owner Info */}
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Owner Information
            </h2>
            <p className="font-medium">{vehicle.owner_name || 'N/A'}</p>
            <p className="text-sm text-slate-500">{vehicle.owner_phone}</p>
            <p className="text-sm text-slate-500">{vehicle.owner_email}</p>
          </Card>

          {/* Vehicle Photos */}
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Vehicle Photos ({vehicleImages.length} uploaded)
            </h2>

            {vehicleImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {vehicleImages.map((img, index) => (
                  <div key={img.id || index} className="relative rounded-lg overflow-hidden">
                    <img
                      src={img.image_url || img.url}
                      alt={`Vehicle photo ${index + 1}`}
                      className="w-full h-40 object-cover"
                      crossOrigin="anonymous"
                    />
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No photos uploaded</p>
            )}
          </Card>

          {/* ✅ Vehicle Documents with Approve/Reject Buttons */}
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Vehicle Documents
            </h2>

            <div className="space-y-3">
              {requiredTypes.map((type) => {
                const doc = vehicleDocuments.find(d => d.document_type === type);
                const statusConfig = doc ? getDocStatusConfig(doc.status) : null;
                
                return (
                  <div key={type} className={`p-4 rounded-lg border ${
                    doc?.status === 'approved' ? 'border-green-200 bg-green-50' :
                    doc?.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                    doc?.status === 'rejected' ? 'border-red-200 bg-red-50' :
                    'border-slate-200 bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{getDocumentLabel(type)}</p>
                        {doc ? (
                          <p className="text-xs text-slate-500">
                            Uploaded: {formatDate(doc.created_at)}
                            {doc.verified_at && ` • Verified: ${formatDate(doc.verified_at)}`}
                          </p>
                        ) : (
                          <p className="text-xs text-red-500">Not uploaded</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc && (
                          <>
                            <Badge variant={statusConfig?.variant || 'secondary'} size="sm">
                              {statusConfig?.icon && <statusConfig.icon className="w-3 h-3 mr-1" />}
                              {statusConfig?.label || 'Unknown'}
                            </Badge>
                            
                            {/* ✅ APPROVE BUTTON */}
                            {doc.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  handleDocApprove(doc.id);
                                }}
                                isLoading={docActionLoading && selectedDoc?.id === doc.id}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            
                            {/* ✅ REJECT BUTTON */}
                            {doc.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="danger"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setShowDocModal(true);
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            )}
                            
                            {/* ✅ VIEW BUTTON */}
                            {doc.document_url && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(doc.document_url, '_blank')}
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {doc?.status === 'rejected' && doc.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-100 rounded">
                        <p className="text-xs text-red-700">
                          <strong>Reason:</strong> {doc.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Approval Actions</h3>

            <div className="space-y-3">
              {vehicle.status !== 'approved' && (
                <Button 
                  fullWidth 
                  variant="success" 
                  onClick={handleApprove} 
                  isLoading={actionLoading}
                  disabled={!allUploaded || !allVerified}
                >
                  <Check className="w-4 h-4" />
                  Approve Vehicle
                </Button>
              )}

              {vehicle.status !== 'rejected' && (
                <Button 
                  fullWidth 
                  variant="danger" 
                  onClick={() => setRejectModal(true)}
                >
                  <X className="w-4 h-4" />
                  Reject Vehicle
                </Button>
              )}

              {vehicle.status === 'approved' && (
                <Button fullWidth variant="outline" onClick={handleSuspend}>
                  <AlertCircle className="w-4 h-4" />
                  Suspend Vehicle
                </Button>
              )}
            </div>

            {/* Status Messages */}
            {!allUploaded && (
              <p className="text-sm text-yellow-600 mt-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Some required documents are missing
              </p>
            )}
            {allUploaded && !allVerified && (
              <p className="text-sm text-yellow-600 mt-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Some documents are pending verification
              </p>
            )}
          </Card>

          {/* Review Checklist */}
          <Card className="bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              Review Checklist
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                {vehicleImages.length > 0 ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                Vehicle photos clear
              </li>
              <li className="flex items-center gap-2">
                {vehicleDocuments.some(d => d.document_type === 'vehicle_rc' && d.status === 'approved') ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                Registration valid
              </li>
              <li className="flex items-center gap-2">
                {vehicleDocuments.some(d => d.document_type === 'insurance' && d.status === 'approved') ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                Insurance current
              </li>
              <li className="flex items-center gap-2">
                {vehicleDocuments.some(d => d.document_type === 'tax_token' && d.status === 'approved') ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                Tax Token valid
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Vehicle Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">Reject Vehicle</h3>
            <textarea
              rows="4"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setRejectModal(false)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={handleReject} isLoading={actionLoading}>Confirm Reject</Button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Document Reject Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowDocModal(false);
            setSelectedDoc(null);
            setDocRejectReason('');
          }} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">
              Reject {getDocumentLabel(selectedDoc.document_type)}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Provide a reason for rejecting this document
            </p>
            <textarea
              rows="4"
              placeholder="Enter rejection reason..."
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm mb-4"
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedDoc(null);
                  setDocRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                onClick={handleDocReject} 
                isLoading={docActionLoading}
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

export default VehicleReview;
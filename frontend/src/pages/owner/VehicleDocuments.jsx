import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Shield,
  RefreshCw,
  X,
  Upload
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'react-toastify';

const VehicleDocuments = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ blocked: 0, pending: 0, expired: 0, ready: 0 });

  // ✅ Re-upload states - each document has its own
  const [reuploadStates, setReuploadStates] = useState({});
  const [uploadingDocId, setUploadingDocId] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching owner vehicles...');
      const response = await api.get('/vehicles/my');
      console.log('✅ Vehicles response:', response.data);

      const vehiclesData = response.data.data || [];

      const vehiclesWithCompliance = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          try {
            const complianceRes = await api.get(`/vehicles/${vehicle.id}/compliance`);
            const docsRes = await api.get(`/vehicles/${vehicle.id}/documents`);

            return {
              ...vehicle,
              compliance: complianceRes.data.data,
              documents: docsRes.data.data || []
            };
          } catch (error) {
            console.error(`❌ Failed for vehicle ${vehicle.id}:`, error);
            return {
              ...vehicle,
              compliance: {
                eligible: false,
                status: 'blocked',
                notes: ['Compliance check failed'],
                documentStats: { approved: 0, required: 3 }
              },
              documents: []
            };
          }
        })
      );

      console.log('✅ Vehicles with compliance:', vehiclesWithCompliance);
      setVehicles(vehiclesWithCompliance);

      const statsData = {
        blocked: 0,
        pending: 0,
        expired: 0,
        ready: 0
      };

      vehiclesWithCompliance.forEach(v => {
        if (v.compliance) {
          switch (v.compliance.status) {
            case 'rental_ready': statsData.ready++; break;
            case 'under_review': statsData.pending++; break;
            case 'blocked': statsData.blocked++; break;
            case 'suspended': statsData.blocked++; break;
          }
        }
      });

      setStats(statsData);

    } catch (error) {
      console.error('❌ Failed to fetch vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
    toast.success('Refreshed successfully');
  };

  // ✅ Get document status from real data
  const getDocumentStatus = (vehicle, docType) => {
    if (vehicle.documents && vehicle.documents.length > 0) {
      const doc = vehicle.documents.find(d => d.document_type === docType);
      if (doc) {
        return {
          status: doc.status,
          uploadedAt: doc.created_at,
          verifiedBy: doc.verified_by,
          verifiedAt: doc.verified_at,
          expiryDate: doc.expiry_date,
          rejectionReason: doc.rejection_reason,
          url: doc.document_url,
          id: doc.id,
          vehicle_id: doc.vehicle_id,
          document_type: doc.document_type,
          filename: doc.document_url?.split('/').pop() || 'document'
        };
      }
    }
    return { status: 'missing', document_type: docType };
  };

  // ✅ Get missing documents list
  const getMissingDocuments = (vehicle) => {
    const required = ['vehicle_rc', 'insurance', 'tax_token'];
    const missing = [];

    required.forEach(type => {
      const doc = getDocumentStatus(vehicle, type);
      if (doc.status !== 'approved' && doc.status !== 'verified') {
        missing.push(type);
      }
    });

    return missing;
  };

  // ✅ Handle file selection for a specific document
  const handleFileSelect = (docId, docType, docData) => {
    const fileInput = document.getElementById(`file-${docId}`);
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      console.log(`📎 File selected for ${docType}:`, file.name);

      setReuploadStates(prev => ({
        ...prev,
        [docId]: {
          file: file,
          doc: docData
        }
      }));
      toast.info(`File selected: ${file.name}`);
    }
  };

  // ✅ Handle upload for a specific document
  const handleUpload = async (docId) => {
    const state = reuploadStates[docId];
    if (!state || !state.file) {
      toast.warning('Please select a file first');
      return;
    }

    if (!state.doc || !state.doc.document_type) {
      toast.error('Document data missing');
      return;
    }

    setUploadingDocId(docId);

    try {
      const formData = new FormData();
      formData.append('document_type', state.doc.document_type);
      formData.append('vehicle_id', state.doc.vehicle_id || selectedVehicle?.id);
      formData.append('file', state.file);

      console.log('📤 Uploading:', {
        document_type: state.doc.document_type,
        vehicle_id: state.doc.vehicle_id || selectedVehicle?.id,
        file: state.file.name
      });

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${state.doc.document_type.replace('_', ' ').toUpperCase()} uploaded successfully!`);
      
      // Clear this document's state
      setReuploadStates(prev => {
        const newState = { ...prev };
        delete newState[docId];
        return newState;
      });
      
      setShowModal(false);
      await fetchVehicles();
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingDocId(null);
    }
  };

  const getComplianceBadge = (compliance) => {
    if (!compliance) {
      return <Badge variant="secondary">Checking...</Badge>;
    }

    const statusMap = {
      'rental_ready': { label: '🟢 Rental Ready', variant: 'success' },
      'under_review': { label: '🟡 Under Review', variant: 'warning' },
      'blocked': { label: '🔴 Blocked', variant: 'danger' },
      'suspended': { label: '⚫ Suspended', variant: 'danger' },
    };

    const status = statusMap[compliance.status] || statusMap['blocked'];
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Missing';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-red-600';
    }
  };

  const handleViewDocuments = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
    setReuploadStates({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Documents</h1>
          <p className="text-slate-500 text-sm">Verify vehicle registration and legal documents</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={refreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
          <p className="text-xs text-slate-500">Blocked</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
          <p className="text-xs text-slate-500">Expiring</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
          <p className="text-xs text-slate-500">Rental Ready</p>
        </Card>
      </div>

      <div className="space-y-4">
        {vehicles.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Vehicles Found</h3>
            <p className="text-slate-500 text-sm">Add your first vehicle to start renting</p>
            <Button className="mt-4" onClick={() => navigate('/owner/vehicles/create')}>
              Add Vehicle
            </Button>
          </Card>
        ) : (
          vehicles.map((vehicle) => {
            const missingDocs = getMissingDocuments(vehicle);
            const totalRequired = 3;
            const approvedCount = vehicle.compliance?.documentStats?.approved || 0;

            return (
              <Card key={vehicle.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                      {vehicle.primary_image || vehicle.images?.[0]?.image_url ? (
                        <img
                          src={vehicle.primary_image || vehicle.images[0].image_url}
                          alt={vehicle.brand}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-slate-500">{vehicle.year}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getComplianceBadge(vehicle.compliance)}
                        <span className="text-xs text-slate-400">
                          • {approvedCount}/{totalRequired} verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(getDocumentStatus(vehicle, 'vehicle_rc').status)}
                          <span className={`text-xs font-medium ${getStatusColor(getDocumentStatus(vehicle, 'vehicle_rc').status)}`}>
                            {getStatusLabel(getDocumentStatus(vehicle, 'vehicle_rc').status)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">RC</span>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(getDocumentStatus(vehicle, 'insurance').status)}
                          <span className={`text-xs font-medium ${getStatusColor(getDocumentStatus(vehicle, 'insurance').status)}`}>
                            {getStatusLabel(getDocumentStatus(vehicle, 'insurance').status)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Insurance</span>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(getDocumentStatus(vehicle, 'tax_token').status)}
                          <span className={`text-xs font-medium ${getStatusColor(getDocumentStatus(vehicle, 'tax_token').status)}`}>
                            {getStatusLabel(getDocumentStatus(vehicle, 'tax_token').status)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Tax</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocuments(vehicle)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>

                {!vehicle.compliance?.eligible && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          {missingDocs.length === 1
                            ? `${missingDocs[0].replace('_', ' ').toUpperCase()} is missing`
                            : `${missingDocs.map(d => d.replace('_', ' ').toUpperCase()).join(', ')} required`
                          }
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {approvedCount}/{totalRequired} documents verified — {missingDocs.length} document{missingDocs.length > 1 ? 's' : ''} required
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Vehicle Details Modal with Upload/Re-upload */}
      {showModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </h2>
                  <p className="text-sm text-slate-500">{selectedVehicle.year}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Overall Status</span>
                  {getComplianceBadge(selectedVehicle.compliance)}
                </div>

                {selectedVehicle.compliance && !selectedVehicle.compliance.eligible && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600 font-medium">
                      {selectedVehicle.compliance.notes?.join(', ') || 'Vehicle not rental ready'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedVehicle.compliance?.documentStats?.approved || 0}/3 documents verified
                    </p>
                  </div>
                )}
              </div>

              {/* Documents with Upload/Re-upload */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Legal Documents</h3>
                <div className="space-y-3">
                  {['vehicle_rc', 'insurance', 'tax_token'].map((type) => {
                    const doc = getDocumentStatus(selectedVehicle, type);
                    const docId = `${selectedVehicle.id}-${type}`;
                    const state = reuploadStates[docId];

                    return (
                      <DocumentDetailItem
                        key={docId}
                        docId={docId}
                        title={type === 'vehicle_rc' ? 'Registration Certificate' : type === 'insurance' ? 'Insurance' : 'Tax Token'}
                        doc={doc}
                        vehicleId={selectedVehicle.id}
                        onFileSelect={handleFileSelect}
                        onUpload={handleUpload}
                        selectedFile={state?.file || null}
                        selectedDoc={state?.doc || null}
                        isUploading={uploadingDocId === docId}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Document Detail Item with INDEPENDENT file selection
const DocumentDetailItem = ({
  docId,
  title,
  doc,
  vehicleId,
  onFileSelect,
  onUpload,
  selectedFile,
  selectedDoc,
  isUploading
}) => {
  const isMissing = doc.status === 'missing';
  const isRejected = doc.status === 'rejected';
  const isApproved = doc.status === 'approved' || doc.status === 'verified';
  const isPending = doc.status === 'pending';

  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isApproved ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : isPending ? (
            <Clock className="w-5 h-5 text-yellow-600" />
          ) : isRejected ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <div>
            <p className="font-medium text-slate-900">{title}</p>
            <p className={`text-sm font-medium ${getStatusColor(doc.status)}`}>
              {isApproved ? '✅ Verified' :
                isPending ? '⏳ Pending Review' :
                  isRejected ? '❌ Rejected' :
                    '⚠️ Missing'}
            </p>
          </div>
        </div>

        {/* ✅ Upload for Missing | Re-upload for Rejected - INDEPENDENT */}
        {(isMissing || isRejected) && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <input
                id={`file-${docId}`}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="text-xs w-36 cursor-pointer"
                onChange={(e) => {
                  const docWithType = {
                    ...doc,
                    document_type: doc.document_type ||
                      (title === 'Registration Certificate' ? 'vehicle_rc' :
                        title === 'Insurance' ? 'insurance' : 'tax_token')
                  };
                  onFileSelect(docId, doc.document_type, docWithType);
                }}
              />
            </div>
            {selectedFile && selectedDoc?.id === doc.id && (
              <p className="text-xs text-green-600">✅ {selectedFile.name}</p>
            )}
            <Button
              size="sm"
              variant="primary"
              onClick={() => onUpload(docId)}
              isLoading={isUploading}
              disabled={!selectedFile || selectedDoc?.id !== doc.id}
              className="w-full"
            >
              <Upload className="w-3 h-3 mr-1" />
              {isRejected ? 'Re-upload' : 'Upload'}
            </Button>
          </div>
        )}

        {/* View for Approved */}
        {isApproved && doc.url && (
          <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
            <Eye className="w-3 h-3 mr-1" /> View
          </Button>
        )}

        {/* Pending - Show waiting */}
        {isPending && (
          <Badge variant="warning" size="sm">⏳ Waiting</Badge>
        )}
      </div>

      {/* Details */}
      {doc.uploadedAt && (
        <p className="text-xs text-slate-400 mt-2">
          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
        </p>
      )}

      {doc.expiryDate && (
        <p className="text-xs text-slate-400">
          Expires: {new Date(doc.expiryDate).toLocaleDateString()}
        </p>
      )}

      {doc.verifiedAt && (
        <p className="text-xs text-slate-400">
          Verified: {new Date(doc.verifiedAt).toLocaleDateString()}
        </p>
      )}

      {doc.rejectionReason && (
        <p className="text-xs text-red-600 mt-1">
          Reason: {doc.rejectionReason}
        </p>
      )}
    </div>
  );
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
    case 'verified':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-red-600';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'approved':
    case 'verified':
      return 'Verified';
    case 'pending':
      return 'Pending Review';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Missing';
  }
};

export default VehicleDocuments;
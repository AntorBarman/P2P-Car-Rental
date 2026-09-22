import { useState, useEffect, useCallback } from 'react';
import { 
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  User,
  Car,
  Camera,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import CameraCapture from '../../components/ui/CameraCapture';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const CustomerKYC = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [existingDocuments, setExistingDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingUploads, setPendingUploads] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraForType, setCameraForType] = useState('');
  
  const fetchDocuments = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await api.get('/documents/my');
      const docs = response.data.data || [];
      const docMap = {};
      docs.forEach((doc) => {
        docMap[doc.document_type] = doc;
      });
      setExistingDocuments(docMap);
      console.log('🔍 Documents loaded:', docMap);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setExistingDocuments({});
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  // ✅ Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setTimeout(() => setRefreshing(false), 500);
  };
  
  const handleFileSelect = (docType, file) => {
    setPendingUploads((prev) => ({ ...prev, [docType]: file }));
  };
  
  const handleRemovePending = (docType) => {
    setPendingUploads((prev) => {
      const newState = { ...prev };
      delete newState[docType];
      return newState;
    });
  };
  
  const handleCameraCapture = (file, previewUrl, docType) => {
    setPendingUploads((prev) => ({ ...prev, [docType]: file }));
    setCameraOpen(false);
  };
  
  const handleSubmitAll = async () => {
    const pendingTypes = Object.keys(pendingUploads);
    
    if (pendingTypes.length === 0) {
      alert('No new documents to submit');
      return;
    }
    
    if (!confirm(`Submit ${pendingTypes.length} document(s) for review?`)) return;
    
    setSubmitting(true);
    
    try {
      let successCount = 0;
      
      for (const docType of pendingTypes) {
        const file = pendingUploads[docType];
        const formData = new FormData();
        formData.append('document_type', docType);
        formData.append('file', file);
        
        try {
          await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          successCount++;
        } catch (e) {
          console.error(`Failed: ${docType}`, e);
        }
      }
      
      alert(`${successCount} document(s) submitted!`);
      setPendingUploads({});
      fetchDocuments();
    } finally {
      setSubmitting(false);
    }
  };
  
  const requiredDocuments = [
    { type: 'nid_front', label: 'NID Front Side', icon: User, camera: false },
    { type: 'nid_back', label: 'NID Back Side', icon: User, camera: false },
    { type: 'driving_license_front', label: 'License Front', icon: Car, camera: false },
    { type: 'driving_license_back', label: 'License Back', icon: Car, camera: false },
    { type: 'face_photo', label: 'Live Face Photo', icon: Camera, camera: true },
  ];
  
  const getDocumentByType = (type) => existingDocuments[type];
  
  const approvedCount = requiredDocuments.filter((doc) => 
    getDocumentByType(doc.type)?.status === 'approved'
  ).length;
  
  const pendingCount = requiredDocuments.filter((doc) => 
    getDocumentByType(doc.type)?.status === 'pending'
  ).length;
  
  const rejectedCount = requiredDocuments.filter((doc) => 
    getDocumentByType(doc.type)?.status === 'rejected'
  ).length;
  
  const totalRequired = requiredDocuments.length;
  const progressPercent = Math.round((approvedCount / totalRequired) * 100);
  const isFullyVerified = approvedCount >= totalRequired;
  
  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Driver Verification</h1>
        <Button size="sm" variant="outline" onClick={handleRefresh} isLoading={refreshing}>
          <RefreshCw className="w-3 h-3" /> Refresh Status
        </Button>
      </div>
      <p className="text-slate-500 mb-6">Complete all steps to unlock vehicle booking</p>
      
      {/* Status Card */}
      <Card className={`mb-6 ${isFullyVerified ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center gap-4 mb-3">
          <Shield className={`w-8 h-8 shrink-0 ${isFullyVerified ? 'text-green-600' : 'text-blue-600'}`} />
          <div className="flex-1">
            <p className={`font-bold ${isFullyVerified ? 'text-green-800' : 'text-blue-800'}`}>
              {isFullyVerified ? '✅ Fully Verified!' : `Verification: ${approvedCount}/${totalRequired}`}
            </p>
            <p className="text-sm text-slate-600">
              {pendingCount > 0 && `${pendingCount} under review`}
              {rejectedCount > 0 && ` • ${rejectedCount} rejected`}
              {isFullyVerified && ' — You can now book vehicles!'}
            </p>
          </div>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${isFullyVerified ? 'bg-green-600' : 'bg-blue-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>
      
      {/* Documents List */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Required Documents</h2>
      
      <div className="space-y-3">
        {requiredDocuments.map((doc) => {
          const existing = getDocumentByType(doc.type);
          const pending = pendingUploads[doc.type];
          const DocIcon = doc.icon;
          
          return (
            <Card key={doc.type} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <DocIcon className="w-5 h-5 text-slate-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{doc.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {existing
                      ? `Uploaded: ${formatDate(existing.created_at)}`
                      : pending
                        ? 'Ready to submit ✓'
                        : doc.camera ? 'Camera capture required' : 'Upload required'}
                  </p>
                </div>
                
                {existing?.status === 'approved' ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : existing?.status === 'pending' ? (
                  <Badge variant="warning" size="sm">
                    <Clock className="w-3 h-3 mr-1" /> Under Review
                  </Badge>
                ) : existing?.status === 'rejected' ? (
                  <Badge variant="danger" size="sm">
                    <XCircle className="w-3 h-3 mr-1" /> Rejected
                  </Badge>
                ) : pending ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">Ready</Badge>
                    <button onClick={() => handleRemovePending(doc.type)} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : doc.camera ? (
                  <Button size="sm" onClick={() => { setCameraForType(doc.type); setCameraOpen(true); }}>
                    <Camera className="w-3 h-3" /> Capture
                  </Button>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => { if (e.target.files[0]) handleFileSelect(doc.type, e.target.files[0]); }}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                      <Upload className="w-3 h-3" /> Upload
                    </span>
                  </label>
                )}
              </div>
              
              {/* Rejected — Re-upload */}
              {existing?.status === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <strong>Rejection Reason:</strong> {existing.rejection_reason || 'Document was rejected'}
                  </p>
                  
                  {doc.camera ? (
                    <Button size="sm" onClick={() => { setCameraForType(doc.type); setCameraOpen(true); }}>
                      <Camera className="w-3 h-3" /> Retake Photo
                    </Button>
                  ) : (
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => { if (e.target.files[0]) handleFileSelect(doc.type, e.target.files[0]); }}
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                        <Upload className="w-3 h-3" /> Re-upload Document
                      </span>
                    </label>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Submit Button */}
      {Object.keys(pendingUploads).length > 0 && (
        <Button fullWidth size="lg" onClick={handleSubmitAll} isLoading={submitting} className="mt-6">
          <Send className="w-5 h-5" />
          Submit {Object.keys(pendingUploads).length} Document(s) for Review
        </Button>
      )}
      
      {/* Camera Modal */}
      {cameraOpen && (
        <CameraCapture
          onCapture={(file, preview) => handleCameraCapture(file, preview, cameraForType)}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerKYC;
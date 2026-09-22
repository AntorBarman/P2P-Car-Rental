// frontend/src/pages/KYCPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';

const KYCPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('nid_front');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchKYCStatus();
  }, [user]);
  
  const fetchKYCStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/kyc-status');
      console.log('🔍 KYC Status:', response.data);
      setKycStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning('Please select a file');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type', documentType);
      
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Upload response:', response.data);
      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      fetchKYCStatus();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  const documentLabels = {
    nid_front: 'NID Front',
    nid_back: 'NID Back',
    face_photo: 'Face Photo'
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
        <p className="text-slate-500">Upload your documents to verify your identity</p>
      </div>
      
      {/* KYC Status */}
      {kycStatus && (
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            {kycStatus.isKYCVerified ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            )}
            <div>
              <h2 className="font-semibold text-slate-900">
                {kycStatus.isKYCVerified ? 'KYC Verified' : 'KYC Pending'}
              </h2>
              <p className="text-sm text-slate-500">
                {kycStatus.isKYCVerified 
                  ? 'Your identity has been verified' 
                  : `Missing documents: ${kycStatus.missingDocuments?.map(d => documentLabels[d] || d).join(', ') || 'None'}`}
              </p>
            </div>
          </div>
          
          {/* Document Status */}
          <div className="space-y-2">
            {Object.keys(documentLabels).map((docType) => {
              const doc = kycStatus.documents?.find(d => d.document_type === docType);
              return (
                <div key={docType} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    {documentLabels[docType]}
                  </span>
                  {doc ? (
                    doc.status === 'approved' ? (
                      <Badge variant="success">Approved</Badge>
                    ) : doc.status === 'pending' ? (
                      <Badge variant="warning">Pending</Badge>
                    ) : (
                      <Badge variant="danger">Rejected</Badge>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">Not uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Upload Section */}
      {!kycStatus?.isKYCVerified && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Upload Document</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {Object.keys(documentLabels).map((type) => (
                  <option key={type} value={type}>
                    {documentLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            
            <Button
              fullWidth
              onClick={handleUpload}
              isLoading={uploading}
              disabled={!selectedFile}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </Card>
      )}
      
      {/* Back Button */}
      <div className="text-center mt-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default KYCPage;
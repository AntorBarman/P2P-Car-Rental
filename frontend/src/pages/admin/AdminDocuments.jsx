import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, AlertCircle, 
  Eye, FileText, Calendar, User, Shield 
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-toastify';

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/documents');
      setDocuments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId) => {
    try {
      await api.patch(`/admin/documents/${docId}/approve`);
      toast.success('Document approved successfully!');
      fetchDocuments();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (docId) => {
    if (!reason) {
      toast.warning('Please enter rejection reason');
      return;
    }

    try {
      await api.patch(`/admin/documents/${docId}/reject`, { reason });
      toast.success('Document rejected');
      setShowModal(false);
      setReason('');
      fetchDocuments();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getComplianceStatus = (doc) => {
    // Simple compliance check - 3 required documents
    const requiredTypes = ['vehicle_rc', 'insurance', 'tax_token'];
    const approvedDocs = doc.filter(d => d.status === 'approved');
    const allApproved = requiredTypes.every(type => 
      approvedDocs.some(d => d.document_type === type)
    );
    
    return allApproved ? 'rental_ready' : 'blocked';
  };

  if (loading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Documents</h1>
        <Button onClick={fetchDocuments} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {doc.document_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User className="w-3 h-3" />
                      {doc.user_name}
                      <span className="text-xs">({doc.user_email})</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.expiry_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(doc.status)}
                
                {doc.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(doc.id)}
                      variant="success"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setShowModal(true);
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(doc.document_url, '_blank')}
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Document</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this document.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="3"
            />
            <div className="flex gap-2 mt-4">
              <Button 
                variant="danger" 
                onClick={() => handleReject(selectedDoc?.id)}
              >
                Reject Document
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;
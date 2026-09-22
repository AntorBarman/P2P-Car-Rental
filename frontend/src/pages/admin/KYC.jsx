import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  RefreshCw
} from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import { toast } from 'react-toastify';

const AdminKYC = () => {
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // ✅ Review states
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // ✅ Reject modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectDocId, setRejectDocId] = useState(null);
  const [rejectDocName, setRejectDocName] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/documents');
      const data = response.data.data || [];
      
      const kycDocs = data.filter(doc => 
        ['nid_front', 'nid_back', 'driving_license_front', 'driving_license_back', 'face_photo'].includes(doc.document_type)
      );
      
      setDocuments(kycDocs);
      updateFilters(kycDocs, searchTerm, statusFilter, userTypeFilter);
      calculateStats(kycDocs);
      
    } catch (error) {
      console.error('Failed to fetch KYC documents:', error);
      toast.error('Failed to load KYC documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (docs) => {
    const pending = docs.filter(d => d.status === 'pending').length;
    const approved = docs.filter(d => d.status === 'approved').length;
    const rejected = docs.filter(d => d.status === 'rejected').length;
    
    setStats({
      pending,
      approved,
      rejected,
      total: docs.length
    });
  };

  const updateFilters = (docs, search, status, userType) => {
    let filtered = [...docs];
    
    if (status !== 'all') {
      filtered = filtered.filter(d => d.status === status);
    }
    
    if (userType !== 'all') {
      filtered = filtered.filter(d => d.user_role === userType);
    }
    
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(d => 
        d.user_name?.toLowerCase().includes(term) ||
        d.user_email?.toLowerCase().includes(term)
      );
    }
    
    setFilteredDocs(filtered);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateFilters(documents, value, statusFilter, userTypeFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    updateFilters(documents, searchTerm, status, userTypeFilter);
  };

  const handleUserTypeFilter = (type) => {
    setUserTypeFilter(type);
    updateFilters(documents, searchTerm, statusFilter, type);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    toast.success('Refreshed');
  };

  // ✅ Approve handler
  const handleApprove = async (docId) => {
    if (!docId) {
      toast.error('Document ID is missing');
      return;
    }
    
    setActionLoading(true);
    try {
      await api.patch(`/admin/documents/${docId}/approve`);
      toast.success('Document approved!');
      setSelectedUser(null);
      await fetchDocuments();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Open reject modal
  const openRejectModal = (doc) => {
    console.log('🔍 Opening reject modal for:', doc);
    
    if (!doc || !doc.id) {
      toast.error('Document data is missing');
      return;
    }
    
    setRejectDocId(doc.id);
    setRejectDocName(doc.document_type || 'Document');
    setRejectReason('');
    setShowRejectModal(true);
  };

  // ✅ Handle reject - FIXED
  const handleReject = async () => {
    console.log('🔍 Rejecting document ID:', rejectDocId);
    console.log('🔍 Reason:', rejectReason);
    
    if (!rejectDocId) {
      toast.error('Document ID is missing');
      return;
    }
    
    if (!rejectReason.trim()) {
      toast.warning('Please provide rejection reason');
      return;
    }

    setRejectLoading(true);
    try {
      await api.patch(`/admin/documents/${rejectDocId}/reject`, { reason: rejectReason });
      toast.success('Document rejected successfully!');
      setShowRejectModal(false);
      setRejectDocId(null);
      setRejectReason('');
      setSelectedUser(null);
      await fetchDocuments();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setRejectLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDocumentLabel = (type) => {
    const labels = {
      'nid_front': 'NID Front',
      'nid_back': 'NID Back',
      'driving_license_front': 'License Front',
      'driving_license_back': 'License Back',
      'face_photo': 'Face Photo'
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  };

  const groupByUser = (docs) => {
    const groups = {};
    docs.forEach(doc => {
      const key = doc.user_id;
      if (!groups[key]) {
        groups[key] = {
          user: {
            id: doc.user_id,
            name: doc.user_name,
            email: doc.user_email,
            phone: doc.user_phone,
            role: doc.user_role
          },
          documents: []
        };
      }
      groups[key].documents.push(doc);
    });
    return Object.values(groups);
  };

  const isFullyVerified = (userDocs) => {
    const required = ['nid_front', 'nid_back', 'driving_license_front', 'driving_license_back', 'face_photo'];
    const approved = userDocs.filter(d => d.status === 'approved').map(d => d.document_type);
    return required.every(type => approved.includes(type));
  };

  const groupedUsers = groupByUser(filteredDocs);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KYC Verification Portal</h1>
          <p className="text-slate-500">Review and verify customer & owner identity documents</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
        <Card className="p-4 text-center border-green-200 bg-green-50">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-xs text-green-600">Approved</p>
        </Card>
        <Card className="p-4 text-center border-red-200 bg-red-50">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-xs text-red-600">Rejected</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button 
          size="sm" 
          variant={statusFilter === 'all' ? 'primary' : 'outline'}
          onClick={() => handleStatusFilter('all')}
        >
          All ({documents.length})
        </Button>
        <Button 
          size="sm" 
          variant={statusFilter === 'pending' ? 'primary' : 'outline'}
          onClick={() => handleStatusFilter('pending')}
          className="text-yellow-600"
        >
          Pending ({stats.pending})
        </Button>
        <Button 
          size="sm" 
          variant={statusFilter === 'approved' ? 'primary' : 'outline'}
          onClick={() => handleStatusFilter('approved')}
          className="text-green-600"
        >
          Approved ({stats.approved})
        </Button>
        <Button 
          size="sm" 
          variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
          onClick={() => handleStatusFilter('rejected')}
          className="text-red-600"
        >
          Rejected ({stats.rejected})
        </Button>
        
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name or email..."
            icon={Search}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* User Type Tabs */}
      <div className="flex gap-2 mb-4">
        <Button 
          size="sm" 
          variant={userTypeFilter === 'all' ? 'primary' : 'outline'}
          onClick={() => handleUserTypeFilter('all')}
        >
          All Users
        </Button>
        <Button 
          size="sm" 
          variant={userTypeFilter === 'customer' ? 'primary' : 'outline'}
          onClick={() => handleUserTypeFilter('customer')}
        >
          Customers
        </Button>
        <Button 
          size="sm" 
          variant={userTypeFilter === 'owner' ? 'primary' : 'outline'}
          onClick={() => handleUserTypeFilter('owner')}
        >
          Owners
        </Button>
      </div>

      {/* KYC List */}
      {groupedUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No KYC applications</h3>
          <p className="text-slate-500 text-sm">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} applications match your filters.` 
              : 'No applications match your filters.'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => handleStatusFilter('all')}>
            View All
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedUsers.map((group) => {
            const verified = isFullyVerified(group.documents);
            const hasPending = group.documents.some(d => d.status === 'pending');
            const hasRejected = group.documents.some(d => d.status === 'rejected');
            
            return (
              <Card key={group.user.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{group.user.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-500">{group.user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={group.user.role === 'owner' ? 'primary' : 'secondary'} size="sm">
                          {group.user.role || 'customer'}
                        </Badge>
                        {verified ? (
                          <Badge variant="success" size="sm">✅ Fully Verified</Badge>
                        ) : hasRejected ? (
                          <Badge variant="danger" size="sm">❌ Some Rejected</Badge>
                        ) : hasPending ? (
                          <Badge variant="warning" size="sm">⏳ Pending</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {group.documents.map(doc => (
                        <div key={doc.id} className="text-center">
                          <div className="flex items-center gap-1">
                            {doc.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : doc.status === 'pending' ? (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-[10px] text-slate-500">
                              {getDocumentLabel(doc.document_type).split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedUser(group)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ✅ Review Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setSelectedUser(null);
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-[500px] max-w-[90%] bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">KYC Review</h3>
                  <p className="text-sm text-slate-500">{selectedUser.user.name}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded">
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedUser.user.role === 'owner' ? 'primary' : 'secondary'}>
                  {selectedUser.user.role || 'customer'}
                </Badge>
                {isFullyVerified(selectedUser.documents) ? (
                  <Badge variant="success">✅ Verified</Badge>
                ) : (
                  <Badge variant="warning">⏳ Incomplete</Badge>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {selectedUser.documents.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{getDocumentLabel(doc.document_type)}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      
                      {doc.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleApprove(doc.id)}
                            isLoading={actionLoading}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => openRejectModal(doc)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
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
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Reject Modal - Clean and Simple */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => {
              setShowRejectModal(false);
              setRejectDocId(null);
              setRejectReason('');
            }} 
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Reject Document</h3>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectDocId(null);
                  setRejectReason('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              {getDocumentLabel(rejectDocName)} — Please provide a reason for rejection
            </p>
            
            <textarea
              rows="4"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
            
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectDocId(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                onClick={handleReject} 
                isLoading={rejectLoading}
                disabled={!rejectReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
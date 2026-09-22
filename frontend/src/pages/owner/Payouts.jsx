import { useState } from 'react';
import { 
  Banknote, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye,
  X,
  TrendingUp,
  ChevronRight,
  Check,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
const OwnerPayouts = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  
  // Mock data — real backend থেকে আসবে
  const [payouts] = useState([
    {
      id: 'p1',
      reference: 'WD-20260823-001',
      amount: 50000,
      method: 'bKash',
      account: '01712345678',
      status: 'pending',
      processingFee: 0,
      netPayout: 50000,
      requestedAt: '2026-08-23T10:32:00Z',
      timeline: [
        { label: 'Request submitted', status: 'completed', time: '23 Aug • 10:32 AM' },
        { label: 'Under review', status: 'active', time: 'Pending' },
        { label: 'Processing', status: 'upcoming', time: null },
        { label: 'Completed', status: 'upcoming', time: null },
      ],
    },
    {
      id: 'p2',
      reference: 'WD-20260815-003',
      amount: 30000,
      method: 'Bank Transfer',
      account: 'AC-123456789',
      status: 'completed',
      processingFee: 0,
      netPayout: 30000,
      requestedAt: '2026-08-15T14:00:00Z',
      completedAt: '2026-08-16T09:00:00Z',
      timeline: [
        { label: 'Request submitted', status: 'completed', time: '15 Aug • 2:00 PM' },
        { label: 'Under review', status: 'completed', time: '15 Aug • 5:30 PM' },
        { label: 'Processing', status: 'completed', time: '16 Aug • 8:00 AM' },
        { label: 'Completed', status: 'completed', time: '16 Aug • 9:00 AM' },
      ],
    },
    {
      id: 'p3',
      reference: 'WD-20260801-002',
      amount: 20000,
      method: 'Nagad',
      account: '01812345678',
      status: 'completed',
      processingFee: 0,
      netPayout: 20000,
      requestedAt: '2026-08-01T09:15:00Z',
      completedAt: '2026-08-02T11:00:00Z',
      timeline: [
        { label: 'Request submitted', status: 'completed', time: '01 Aug • 9:15 AM' },
        { label: 'Under review', status: 'completed', time: '01 Aug • 1:00 PM' },
        { label: 'Processing', status: 'completed', time: '02 Aug • 9:00 AM' },
        { label: 'Completed', status: 'completed', time: '02 Aug • 11:00 AM' },
      ],
    },
  ]);
  
  const maskAccount = (account) => {
    if (!account) return 'N/A';
    if (account.startsWith('AC-')) {
      return `AC-******${account.slice(-4)}`;
    }
    if (account.startsWith('01')) {
      return `01*******${account.slice(-2)}`;
    }
    return account;
  };
  
  const pendingPayouts = payouts.filter((p) => p.status === 'pending');
  const completedPayouts = payouts.filter((p) => p.status === 'completed');
  const processingPayouts = payouts.filter((p) => p.status === 'processing');
  const failedPayouts = payouts.filter((p) => p.status === 'failed');
  
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalProcessing = processingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalRequested = totalPending + totalCompleted + totalProcessing;
  
  const filteredPayouts = activeFilter === 'all' 
    ? payouts 
    : payouts.filter((p) => p.status === activeFilter);
  
  const handleCancelRequest = () => {
    alert('Withdrawal request cancelled. Funds returned to available balance.');
    setCancelModal(null);
  };
  
  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      processing: 'primary',
      completed: 'success',
      failed: 'danger',
      cancelled: 'default',
    };
    return variants[status] || 'default';
  };
  
  return (
    <div>
      <PageHeader 
        title="Payouts" 
        description="Track your withdrawal requests"
        actions={
          <Button size="sm">
            <Banknote className="w-4 h-4" />
            Withdraw Funds
          </Button>
        }
      />
      
      {/* ============ SUMMARY CARDS ============ */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3">
          <Clock className="w-5 h-5 text-yellow-600 mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Pending Payout</p>
          <p className="text-lg font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
          <p className="text-[10px] text-slate-400">{pendingPayouts.length} request(s)</p>
        </Card>
        
        <Card className="p-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Processing</p>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(totalProcessing)}</p>
          <p className="text-[10px] text-slate-400">{processingPayouts.length} request(s)</p>
        </Card>
        
        <Card className="p-3">
          <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Completed</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalCompleted)}</p>
          <p className="text-[10px] text-slate-400">{completedPayouts.length} request(s)</p>
        </Card>
      </div>
      
      {/* ============ FILTER TABS ============ */}
      <div className="flex gap-1 mb-3 bg-white border border-slate-200 rounded-lg p-1 w-fit overflow-x-auto">
        {['all', 'pending', 'processing', 'completed', 'failed'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
              activeFilter === filter ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      
      {/* ============ WITHDRAWAL HISTORY ============ */}
      <div className="space-y-2">
        {filteredPayouts.map((payout) => (
          <Card key={payout.id} className="p-4">
            <div className="flex items-center gap-3">
              {/* Amount */}
              <div className="min-w-[100px]">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(payout.amount)}</p>
                <p className="text-[10px] text-slate-400">{payout.method} • {maskAccount(payout.account)}</p>
              </div>
              
              {/* Reference */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-slate-500">{payout.reference}</p>
                <p className="text-[10px] text-slate-400">{formatDate(payout.requestedAt)}</p>
              </div>
              
              {/* Status */}
              <StatusBadge status={payout.status} size="sm" />
              
              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedPayout(payout)}
                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                  title="View Details"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                </button>
                
                {payout.status === 'pending' && (
                  <button
                    onClick={() => setCancelModal(payout)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {filteredPayouts.length === 0 && (
          <Card className="py-8 text-center">
            <p className="text-sm text-slate-400">No {activeFilter} payouts</p>
          </Card>
        )}
      </div>
      
      {/* ============ DETAILS MODAL ============ */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPayout(null)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Withdrawal Details
              </h3>
              <button onClick={() => setSelectedPayout(null)} className="p-1.5 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Reference:</span></div>
                <div className="font-mono">{selectedPayout.reference}</div>
                <div><span className="text-slate-500">Amount:</span></div>
                <div className="font-bold">{formatCurrency(selectedPayout.amount)}</div>
                <div><span className="text-slate-500">Method:</span></div>
                <div>{selectedPayout.method}</div>
                <div><span className="text-slate-500">Account:</span></div>
                <div>{maskAccount(selectedPayout.account)}</div>
                <div><span className="text-slate-500">Processing Fee:</span></div>
                <div>{formatCurrency(selectedPayout.processingFee || 0)}</div>
                <div><span className="text-slate-500">Net Payout:</span></div>
                <div className="font-bold text-green-700">{formatCurrency(selectedPayout.netPayout)}</div>
              </div>
              
              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Timeline</p>
                <div className="space-y-2">
                  {selectedPayout.timeline.map((step, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 ${
                        step.status === 'completed' ? 'bg-green-600' : step.status === 'active' ? 'bg-yellow-500' : 'bg-slate-200'
                      }`}>
                        {step.status === 'completed' && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${step.status === 'active' ? 'text-yellow-700' : 'text-slate-700'}`}>
                          {step.label}
                        </p>
                        {step.time && <p className="text-[10px] text-slate-400">{step.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ============ CANCEL MODAL ============ */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCancelModal(null)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Cancel Withdrawal Request?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Amount: {formatCurrency(cancelModal.amount)}
                  <br />
                  Reference: {cancelModal.reference}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Funds will be returned to your available balance.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" fullWidth onClick={() => setCancelModal(null)}>
                Keep Request
              </Button>
              <Button variant="danger" size="sm" fullWidth onClick={handleCancelRequest}>
                Cancel Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPayouts;
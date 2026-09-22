import { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Banknote,
  ArrowDownToLine,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import walletService from '../../services/walletService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OwnerEarnings = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Withdrawal Modal
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bkash');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(null);
  
  const fetchWalletData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions({ page: 1, limit: 50 }),
      ]);
      
      setBalance(balanceRes.data || balanceRes);
      setTransactions(txRes.data || []);
    } catch (error) {
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);
  
  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amount > (availableForWithdrawal || 0)) {
      alert('Insufficient available balance');
      return;
    }
    
    if (!withdrawAccount.trim()) {
      alert(`Please enter your ${withdrawMethod === 'bank' ? 'bank account' : withdrawMethod} number`);
      return;
    }
    
    setWithdrawLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const reference = `WD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      
      setWithdrawSuccess({
        amount,
        method: withdrawMethod,
        account: withdrawAccount,
        reference,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
      
      setWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAccount('');
      setWithdrawLoading(false);
    }, 1000);
  };
  
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <ErrorState title="Failed" message={error} onRetry={fetchWalletData} />;
  }
  
  // ============ FINANCIAL CALCULATIONS ============
  const totalCredits = balance?.totalCredit || 0;
  const totalDebits = balance?.totalDebit || 0;
  
  // Owner earnings (after 15% commission)
  const ownerEarnings = totalCredits; // Already net earnings
  const platformCommission = totalCredits * 0.15 / 0.85; // Calculate gross
  
  // Pending earnings (not yet settled)
  const pendingEarnings = transactions
    .filter((t) => t.transaction_type === 'owner_earning' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  
  // Available for withdrawal
  const availableForWithdrawal = balance?.currentBalance || balance?.balance || 0;
  
  // Total withdrawn
  const totalWithdrawn = transactions
    .filter((t) => t.transaction_type === 'withdrawal')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  
  const getTransactionIcon = (tx) => {
    if (tx.transaction_type === 'booking_payment') return { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (tx.transaction_type === 'commission') return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' };
    if (tx.transaction_type === 'owner_earning') return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
    if (tx.transaction_type === 'withdrawal') return { icon: Banknote, color: 'text-purple-600', bg: 'bg-purple-100' };
    if (tx.transaction_type === 'deposit_refund') return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
    return { icon: Wallet, color: 'text-slate-600', bg: 'bg-slate-100' };
  };
  
  return (
    <div>
      <PageHeader title="Wallet & Payouts" description="Track earnings, withdrawals, and transactions" />
      
      {/* ============ FINANCIAL OVERVIEW ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Available for Withdrawal */}
        <Card className="p-4 bg-gradient-to-br from-green-600 to-green-800 text-white border-green-700">
          <Wallet className="w-5 h-5 mb-2" />
          <p className="text-[10px] text-green-100 uppercase">Available</p>
          <p className="text-xl font-bold">{formatCurrency(availableForWithdrawal)}</p>
        </Card>
        
        {/* Pending Earnings */}
        <Card className="p-4">
          <Clock className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-[10px] text-slate-500 uppercase">Pending Earnings</p>
          <p className="text-xl font-bold text-yellow-700">{formatCurrency(pendingEarnings)}</p>
        </Card>
        
        {/* Total Earnings */}
        <Card className="p-4">
          <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-[10px] text-slate-500 uppercase">Total Earnings</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(ownerEarnings)}</p>
        </Card>
        
        {/* Total Withdrawn */}
        <Card className="p-4">
          <Banknote className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-[10px] text-slate-500 uppercase">Total Withdrawn</p>
          <p className="text-xl font-bold text-purple-700">{formatCurrency(totalWithdrawn)}</p>
        </Card>
      </div>
      
      {/* ============ WITHDRAL BUTTON ============ */}
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setWithdrawModal(true)}>
          <ArrowDownToLine className="w-4 h-4" />
          Withdraw Funds
        </Button>
      </div>
      
      {/* ============ WITHDRAWAL SUCCESS ============ */}
      {withdrawSuccess && (
        <Card className="mb-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Withdrawal Requested!</p>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p>Amount: {formatCurrency(withdrawSuccess.amount)}</p>
                <p>Method: {withdrawSuccess.method.toUpperCase()}</p>
                <p>Account: {withdrawSuccess.account}</p>
                <p>Reference: <span className="font-mono">{withdrawSuccess.reference}</span></p>
                <p>Status: <Badge variant="warning" size="sm">Pending</Badge></p>
              </div>
              <button 
                onClick={() => setWithdrawSuccess(null)} 
                className="mt-2 text-xs text-green-600 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}
      
      {/* ============ TRANSACTION HISTORY ============ */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold">Transaction History</h3>
        </div>
        
        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const iconConfig = getTransactionIcon(tx);
              const TxIcon = iconConfig.icon;
              const isCredit = tx.type === 'credit';
              
              return (
                <div key={tx.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                  {/* Icon */}
                  <div className={`w-9 h-9 ${iconConfig.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <TxIcon className={`w-4 h-4 ${iconConfig.color}`} />
                  </div>
                  
                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {tx.transaction_type?.replace(/_/g, ' ')} • {formatDate(tx.created_at)}
                    </p>
                    {tx.reference_id && (
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {tx.reference_id}</p>
                    )}
                  </div>
                  
                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <StatusBadge status={tx.type === 'credit' ? 'paid' : 'failed'} size="xs" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No Transactions" description="Your earnings will appear here." icon={Wallet} />
        )}
      </Card>
      
      {/* ============ WITHDRAW MODAL ============ */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setWithdrawModal(false)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Withdraw Funds
              </h3>
              <button onClick={() => setWithdrawModal(false)} className="p-1.5 hover:bg-slate-100 rounded">✕</button>
            </div>
            
            {/* Available Balance */}
            <div className="p-3 bg-slate-50 rounded-lg mb-4">
              <p className="text-xs text-slate-500">Available Balance</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(availableForWithdrawal)}</p>
            </div>
            
            <div className="space-y-3">
              {/* Amount */}
              <Input
                label="Amount (৳) *"
                type="number"
                min="100"
                max={availableForWithdrawal}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Min 100, Max ${formatCurrency(availableForWithdrawal)}`}
                required
              />
              
              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payout Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bkash')}
                    className={`p-2 rounded-lg border-2 text-sm font-medium ${withdrawMethod === 'bkash' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('nagad')}
                    className={`p-2 rounded-lg border-2 text-sm font-medium ${withdrawMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    Nagad
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank')}
                    className={`p-2 rounded-lg border-2 text-sm font-medium ${withdrawMethod === 'bank' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    Bank
                  </button>
                </div>
              </div>
              
              {/* Account Number */}
              <Input
                label={`${withdrawMethod === 'bank' ? 'Bank Account Number' : withdrawMethod === 'bkash' ? 'bKash Number' : 'Nagad Number'} *`}
                type="text"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                placeholder={withdrawMethod === 'bank' ? 'Enter bank account' : '01XXXXXXXXX'}
                required
              />
            </div>
            
            {/* Info */}
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
              <p className="text-[10px] text-yellow-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Withdrawal requests are processed within 24-48 hours.
              </p>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" fullWidth onClick={() => setWithdrawModal(false)}>
                Cancel
              </Button>
              <Button size="sm" fullWidth onClick={handleWithdraw} isLoading={withdrawLoading}>
                Request Withdrawal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerEarnings;
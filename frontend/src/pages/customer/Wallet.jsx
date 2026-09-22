import { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import walletService from '../../services/walletService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomerWallet = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [addMoneyModal, setAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  
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
      setError('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);
  
  const handleAddMoney = () => {
    if (!addAmount || Number(addAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    setAddLoading(true);
    setTimeout(() => {
      alert(`Money added: ${formatCurrency(Number(addAmount))}`);
      setAddMoneyModal(false);
      setAddAmount('');
      setAddLoading(false);
      fetchWalletData();
    }, 1000);
  };
  
  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'credits' ? tx.type === 'credit' :
      activeFilter === 'debits' ? tx.type === 'debit' :
      activeFilter === 'refunds' ? tx.transaction_type === 'deposit_refund' :
      true;
    
    const searchStr = `${tx.description || ''} ${tx.reference_id || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <ErrorState title="Failed" message={error} onRetry={fetchWalletData} />;
  }
  
  const availableBalance = balance?.currentBalance || balance?.balance || 0;
  const totalCredits = balance?.totalCredit || 0;
  const totalDebits = balance?.totalDebit || 0;
  
  return (
    <div>
      <PageHeader title="Wallet" description="Manage your UDrive balance and transactions" />
      
      {/* ============ BALANCE CARD ============ */}
      <Card className="p-5 mb-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <Wallet className="w-6 h-6 mb-2" />
            <p className="text-xs text-blue-200">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(availableBalance)}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setAddMoneyModal(true)}>
            <Plus className="w-4 h-4" />
            Add Money
          </Button>
        </div>
      </Card>
      
      {/* ============ SUMMARY CARDS ============ */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Total Added</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalCredits)}</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Total Spent</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totalDebits)}</p>
        </Card>
      </div>
      
      {/* ============ FILTERS ============ */}
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search transactions..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {['all', 'credits', 'debits', 'refunds'].map((filter) => (
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
      </div>
      
      {/* ============ TRANSACTION HISTORY ============ */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold">Transaction History</h3>
        </div>
        
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              const isRefund = tx.transaction_type === 'deposit_refund';
              
              return (
                <div key={tx.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isRefund ? 'bg-blue-100' : isCredit ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {isRefund ? (
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                    ) : isCredit ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(tx.created_at)}
                      {tx.reference_id && <span className="ml-1 font-mono">• {tx.reference_id}</span>}
                    </p>
                  </div>
                  
                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <Badge variant={isRefund ? 'primary' : isCredit ? 'success' : 'danger'} size="xs">
                      {isRefund ? 'Refund' : isCredit ? 'Credit' : 'Debit'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Transactions"
            description="Your wallet activity will appear here."
            icon={Wallet}
          />
        )}
      </Card>
      
      {/* ============ ADD MONEY MODAL ============ */}
      {addMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddMoneyModal(false)} />
          
          <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Add Money</h3>
              <button onClick={() => setAddMoneyModal(false)} className="p-1.5 hover:bg-slate-100 rounded">✕</button>
            </div>
            
            <Input
              label="Amount (৳)"
              type="number"
              min="100"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount"
            />
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" fullWidth onClick={() => setAddMoneyModal(false)}>
                Cancel
              </Button>
              <Button size="sm" fullWidth onClick={handleAddMoney} isLoading={addLoading}>
                Add Money
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerWallet;
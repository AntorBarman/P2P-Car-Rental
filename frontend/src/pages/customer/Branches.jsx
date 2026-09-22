import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Car,
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
import branchService from '../../services/branchService';
import { formatCurrency } from '../../utils/formatters';

const CustomerBranches = () => {
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  
  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await branchService.getAll();
      const branchList = response.data || [];
      console.log('🔍 Branches:', branchList);
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);
  
  const filteredBranches = branches.filter((branch) => {
    const searchStr = `${branch.name || ''} ${branch.city || ''} ${branch.district || ''} ${branch.address || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || branch.city === cityFilter;
    return matchesSearch && matchesCity;
  });
  
  const cities = [...new Set(branches.map((b) => b.city).filter(Boolean))];
  
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  
  if (error) {
    return <ErrorState title="Failed" message={error} onRetry={fetchBranches} />;
  }
  
  return (
    <div>
      <PageHeader 
        title="Branches" 
        description="Find a UDrive pickup location near you"
      />
      
      {/* Search + City Filter */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search city, area or branch..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      
      {/* Branch Cards */}
      {filteredBranches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className="p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{branch.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{branch.code || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={branch.is_active ? 'active' : 'suspended'} size="xs" />
              </div>
              
              {/* Address */}
              <div className="mb-3">
                <p className="text-sm text-slate-600">{branch.address}</p>
                <p className="text-xs text-slate-400">{branch.city}{branch.district ? `, ${branch.district}` : ''}</p>
              </div>
              
              {/* Info Row */}
              <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {branch.phone || 'Not provided'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {branch.opening_time?.slice(0, 5)} – {branch.closing_time?.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  {branch.vehicle_count || 0} cars available
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  fullWidth
                  onClick={() => navigate(`/vehicles?branch_id=${branch.id}`)}
                  disabled={!branch.is_active}
                >
                  <Car className="w-4 h-4" />
                  Browse Cars
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Branches Found"
          description="No UDrive locations match your search."
          icon={MapPin}
        />
      )}
    </div>
  );
};

export default CustomerBranches;
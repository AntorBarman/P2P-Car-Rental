import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, X, Calendar, MapPin, SlidersHorizontal,
  Star, Car, Users, Fuel, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'react-toastify';

const Vehicles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [branches, setBranches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const debounceTimer = useRef(null);
  const searchInputRef = useRef(null);
  
  const [filters, setFilters] = useState({
    branch_id: '',
    vehicle_type: '',
    transmission: '',
    fuel_type: '',
    min_price: '',
    max_price: '',
    brand: '',
    pickup_date: '',
    return_date: '',
    sort_by: 'created_at',
  });

  const limit = 9;

  // ✅ Fetch branches on mount
  useEffect(() => {
    fetchBranches();
    const params = new URLSearchParams(location.search);
    const urlFilters = {};
    params.forEach((value, key) => {
      if (key !== 'page') urlFilters[key] = value;
    });
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
    if (params.get('page')) {
      setCurrentPage(parseInt(params.get('page')));
    }
  }, []);

  // ✅ Fetch vehicles when ANY filter changes (including brand)
  useEffect(() => {
    fetchVehicles();
  }, [
    currentPage, 
    filters.branch_id, 
    filters.vehicle_type, 
    filters.transmission, 
    filters.fuel_type, 
    filters.min_price, 
    filters.max_price, 
    filters.pickup_date, 
    filters.return_date,
    filters.sort_by,
    filters.brand  // ✅ IMPORTANT: Added brand here
  ]);

  // ✅ Debounced search for brand (prevents too many API calls)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      // Brand is already in the dependency array above, but we need to trigger fetch
      // The useEffect above will handle it when brand changes
    }, 500);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters.brand]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: limit,
      };
      
      // Remove empty values
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === '') delete params[key];
      });

      console.log('🔍 Fetching vehicles with params:', params);

      const response = await api.get('/vehicles', { params });
      
      console.log('✅ Response:', response.data);
      
      setVehicles(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 0);
    } catch (error) {
      console.error('❌ Failed to fetch vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle filter change - updates state and URL
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    
    // Update URL
    const params = new URLSearchParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] && filters[k] !== '' && k !== 'brand') {
        params.set(k, filters[k]);
      }
    });
    if (value && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    navigate(`/vehicles?${params.toString()}`);
  };

  // ✅ Handle brand search with debounce
  const handleBrandChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, brand: value }));
    setCurrentPage(1);
  };

  // ✅ Manual search click - fetches immediately
  const handleSearchClick = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    fetchVehicles();
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        params.set(key, filters[key]);
      }
    });
    navigate(`/vehicles?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      branch_id: '',
      vehicle_type: '',
      transmission: '',
      fuel_type: '',
      min_price: '',
      max_price: '',
      brand: '',
      pickup_date: '',
      return_date: '',
      sort_by: 'created_at',
    });
    setCurrentPage(1);
    navigate('/vehicles');
    // fetchVehicles will be called by useEffect
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const params = new URLSearchParams(location.search);
    params.set('page', page);
    navigate(`/vehicles?${params.toString()}`);
  };

  const vehicleTypes = ['sedan', 'suv', 'hatchback', 'microbus', 'pickup', 'luxury'];
  const transmissions = ['automatic', 'manual'];
  const fuelTypes = ['petrol', 'diesel', 'cng', 'hybrid', 'electric'];

  const activeFilterCount = Object.keys(filters).filter(key => 
    filters[key] && filters[key] !== '' && key !== 'sort_by'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Available Vehicles</h1>
        <p className="text-slate-500">Find the perfect car for your journey</p>
      </div>

      {/* Search Bar - Always mounted */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              Pickup Date
            </label>
            <input
              type="date"
              value={filters.pickup_date}
              onChange={(e) => handleFilterChange('pickup_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              Return Date
            </label>
            <input
              type="date"
              value={filters.return_date}
              onChange={(e) => handleFilterChange('return_date', e.target.value)}
              min={filters.pickup_date || new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Search className="w-3 h-3 inline mr-1" />
              Search Vehicle
            </label>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Brand or model..."
              value={filters.brand}
              onChange={handleBrandChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleSearchClick} fullWidth>
              <Search className="w-4 h-4 mr-2" />
              Search Cars
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
              <select
                value={filters.vehicle_type}
                onChange={(e) => handleFilterChange('vehicle_type', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type} className="capitalize">{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Location
              </label>
              <select
                value={filters.branch_id}
                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Locations</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Transmission</label>
              <select
                value={filters.transmission}
                onChange={(e) => handleFilterChange('transmission', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {transmissions.map(type => (
                  <option key={type} value={type} className="capitalize">{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fuel Type</label>
              <select
                value={filters.fuel_type}
                onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {fuelTypes.map(type => (
                  <option key={type} value={type} className="capitalize">{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min Price (৳)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max Price (৳)</label>
              <input
                type="number"
                placeholder="100000"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="created_at">Newest First</option>
                <option value="daily_rate">Price: Low to High</option>
                <option value="daily_rate_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearchClick}>Apply Filters</Button>
          </div>
        </div>
      )}

      {/* Result Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{total}</span> {total === 1 ? 'vehicle' : 'vehicles'} found
          {activeFilterCount > 0 && (
            <span className="ml-2 text-xs text-blue-600">({activeFilterCount} filters active)</span>
          )}
        </p>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-3 h-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-xl font-medium text-slate-900">No vehicles found</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            {filters.pickup_date && filters.return_date 
              ? `No vehicles available for selected dates (${filters.pickup_date} to ${filters.return_date})`
              : 'Try adjusting your filters or search terms'}
          </p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle}
                onViewDetails={() => navigate(`/vehicles/${vehicle.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="min-w-[36px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Vehicle Card Component
const VehicleCard = ({ vehicle, onViewDetails }) => {
  const [imageError, setImageError] = useState(false);
  
  const primaryImage = vehicle.primary_image || vehicle.images?.[0]?.image_url;
  const avgRating = Number(vehicle.average_rating) || 0;
  const reviewCount = vehicle.review_count || 0;
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-slate-100">
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Car className="w-12 h-12" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Available
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-slate-900 text-lg leading-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-slate-500">
            {vehicle.year} • <span className="capitalize">{vehicle.vehicle_type}</span>
          </p>
        </div>

        {avgRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-slate-700">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({reviewCount} reviews)</span>
          </div>
        )}

        <p className="text-sm text-slate-600 flex items-center gap-1 mb-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          {vehicle.branch_name || 'Location not specified'}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {vehicle.seats} Seats
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Settings className="w-3 h-3" />
            {vehicle.transmission}
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Fuel className="w-3 h-3" />
            {vehicle.fuel_type}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-xl font-bold text-blue-600">
              ৳{Number(vehicle.daily_rate).toLocaleString()}
            </span>
            <span className="text-sm text-slate-500"> / day</span>
          </div>
          <Button size="sm" onClick={onViewDetails}>
            View Details →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
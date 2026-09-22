import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { vehicleTypes, locations } from '../../mocks/vehicles';

const FilterSidebar = ({
  filters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
  onClose = null,
}) => {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  const filterContent = (
    <div className="space-y-6">
      {/* Vehicle Type */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Vehicle Type</h3>
        <div className="space-y-2">
          {vehicleTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.vehicle_types?.includes(type.value) || false}
                onChange={(e) => {
                  const types = filters.vehicle_types || [];
                  if (e.target.checked) {
                    handleChange('vehicle_types', [...types, type.value]);
                  } else {
                    handleChange('vehicle_types', types.filter((t) => t !== type.value));
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700 capitalize">{type.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Location</h3>
        <div className="space-y-2">
          {locations.map((location) => (
            <label key={location} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="location"
                checked={filters.location === location}
                onChange={() => handleChange('location', location)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700">{location}</span>
            </label>
          ))}
          {filters.location && (
            <button
              onClick={() => handleChange('location', '')}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear location
            </button>
          )}
        </div>
      </div>
      
      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Daily Price</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => handleChange('min_price', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => handleChange('max_price', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>
      
      {/* Transmission */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Transmission</h3>
        <div className="space-y-2">
          {['automatic', 'manual'].map((trans) => (
            <label key={trans} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="transmission"
                checked={filters.transmission === trans}
                onChange={() => handleChange('transmission', trans)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700 capitalize">{trans}</span>
            </label>
          ))}
          {filters.transmission && (
            <button
              onClick={() => handleChange('transmission', '')}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Fuel Type */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Fuel Type</h3>
        <div className="space-y-2">
          {['petrol', 'diesel', 'cng', 'hybrid', 'electric'].map((fuel) => (
            <label key={fuel} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fuel_type"
                checked={filters.fuel_type === fuel}
                onChange={() => handleChange('fuel_type', fuel)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700 capitalize">{fuel}</span>
            </label>
          ))}
          {filters.fuel_type && (
            <button
              onClick={() => handleChange('fuel_type', '')}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Clear All */}
      <Button variant="outline" fullWidth onClick={onClearFilters}>
        Clear All Filters
      </Button>
    </div>
  );
  
  // Mobile Drawer
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] bg-white shadow-xl overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="font-semibold">Filters</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            {filterContent}
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop Sidebar
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-20">
        {filterContent}
      </div>
    </aside>
  );
};

export default FilterSidebar;
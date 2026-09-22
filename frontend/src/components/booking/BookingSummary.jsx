import { useState } from 'react';
import { MapPin, Calendar, Users, Settings, Fuel, Car } from 'lucide-react';

const BookingSummary = ({ vehicle, pickupDate, returnDate, days }) => {
  const [imgError, setImgError] = useState(false);
  
  // ✅ Correct image source
  const vehicleImage = 
    vehicle.primary_image || 
    vehicle.image_url || 
    vehicle.images?.[0]?.image_url ||
    vehicle.images?.[0]?.url;
  
  console.log('🔍 BookingSummary vehicle:', vehicle);
  console.log('🔍 Image source:', vehicleImage);
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Vehicle Image */}
      <div className="h-48 overflow-hidden bg-slate-100">
        {!imgError && vehicleImage ? (
          <img
            src={vehicleImage}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('❌ Booking summary image failed:', vehicleImage);
              setImgError(true);
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Car className="w-16 h-16 mb-2" />
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        {/* Vehicle Info */}
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {vehicle.brand} {vehicle.model} {vehicle.year}
        </h3>
        
        {vehicle.location && (
          <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
            <MapPin className="w-4 h-4" />
            {vehicle.location}
          </div>
        )}
        
        {vehicle.branch_name && (
          <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
            <MapPin className="w-4 h-4" />
            {vehicle.branch_name}
          </div>
        )}
        
        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {vehicle.seats} Seats
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Settings className="w-3.5 h-3.5" /> {vehicle.transmission}
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Fuel className="w-3.5 h-3.5" /> {vehicle.fuel_type}
          </span>
        </div>
        
        {/* Dates */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500">Pickup:</span>
            <span className="text-slate-900 font-medium">{pickupDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-slate-500">Return:</span>
            <span className="text-slate-900 font-medium">{returnDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Duration:</span>
            <span className="text-slate-900 font-medium">{days} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
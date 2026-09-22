import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Users, 
  Settings, 
  Fuel, 
  Shield,
  Car,           // ✅ Add this import
} from 'lucide-react';
import Badge from '../ui/Badge';

const VehicleCard = ({ vehicle }) => {
  const [imgError, setImgError] = useState(false);
  
  const formatPrice = (price) => {
    return `৳${Number(price).toLocaleString('en-BD')}`;
  };
  
  const vehicleImage = vehicle.primary_image || vehicle.image_url || vehicle.images?.[0]?.image_url;
  
  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200 block"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {!imgError && vehicleImage ? (
          <img
            src={vehicleImage}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => {
              console.log('❌ Image failed:', vehicleImage);
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
        
        {vehicle.is_verified && (
          <div className="absolute top-3 left-3">
            <Badge variant="success" size="sm">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
        
        {vehicle.average_rating > 0 && (
          <div className="absolute bottom-3 right-3 bg-white bg-opacity-90 rounded-lg px-2 py-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-slate-900">
              {Number(vehicle.average_rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="text-xs text-slate-500 capitalize">
          {vehicle.year} • {vehicle.vehicle_type}
        </p>
        
        {vehicle.branch_name && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {vehicle.branch_name}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {vehicle.seats} Seats
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Settings className="w-3.5 h-3.5" />
            {vehicle.transmission}
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Fuel className="w-3.5 h-3.5" />
            {vehicle.fuel_type}
          </span>
        </div>
        
        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-slate-900">
              {formatPrice(vehicle.daily_rate)}
            </span>
            <span className="text-sm text-slate-500">/day</span>
          </div>
          
          <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default VehicleCard;
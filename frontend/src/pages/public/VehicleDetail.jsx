// frontend/src/pages/VehicleDetail.jsx (UPDATED)
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  MapPin,
  Shield,
  CheckCircle,
  ChevronLeft,
  Car,
  Star,
  MessageSquare,
} from 'lucide-react';
import { fetchVehicleById } from '../../features/vehicles/vehicleSlice';
import VehicleGallery from '../../components/vehicle/VehicleGallery';
import VehicleSpecs from '../../components/vehicle/VehicleSpecs';
import VehicleRating from '../../components/vehicle/VehicleRating';
import BookingPanel from '../../components/booking/BookingPanel';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
// ✅ Add these imports
import RatingSummary from '../../components/reviews/RatingSummary';
import ReviewsList from '../../components/reviews/ReviewsList';

const VehicleDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentVehicle, isLoading, error } = useSelector((state) => state.vehicles);
  const [mainImgError, setMainImgError] = useState(false);
  const [showReviews, setShowReviews] = useState(true);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleById(id));
    }
  }, [dispatch, id]);
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton variant="image" className="h-96 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="title" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorState
          title="Failed to Load Vehicle"
          message={error}
          onRetry={() => dispatch(fetchVehicleById(id))}
        />
      </div>
    );
  }
  
  if (!currentVehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Vehicle Not Found</h2>
        <p className="text-slate-500 mb-6">The vehicle you're looking for doesn't exist.</p>
        <Link to="/vehicles" className="text-blue-600 hover:underline">
          ← Back to Vehicles
        </Link>
      </div>
    );
  }
  
  const vehicle = currentVehicle;
  const images = vehicle.images || [];
  const primaryImage = vehicle.primary_image || images[0]?.image_url;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/vehicles" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Back to Vehicles
        </Link>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h1>
          {vehicle.status === 'approved' && (
            <Badge variant="success">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* ✅ Add RatingSummary here */}
          <RatingSummary vehicleId={vehicle.id} compact />
          
          {vehicle.branch_name && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="w-4 h-4" />
              {vehicle.branch_name}
            </span>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Gallery + Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery / Main Image */}
          {images.length > 0 ? (
            <VehicleGallery images={images} />
          ) : !mainImgError && primaryImage ? (
            <div className="relative">
              <img
                src={primaryImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-96 object-cover rounded-xl"
                crossOrigin="anonymous"
                onError={() => {
                  console.log('❌ Main image failed to load:', primaryImage);
                  setMainImgError(true);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-96 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400">
              <Car className="w-20 h-20 mb-4" />
              <span className="text-sm">No Image Available</span>
            </div>
          )}
          
          {/* Description */}
          {vehicle.description && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">About This Vehicle</h2>
              <p className="text-slate-600 leading-relaxed">{vehicle.description}</p>
            </div>
          )}
          
          {/* Specifications */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Specifications</h2>
            <VehicleSpecs vehicle={vehicle} />
          </div>
          
          {/* Details */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 capitalize">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {vehicle.vehicle_type}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 capitalize">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {vehicle.transmission}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 capitalize">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {vehicle.fuel_type}
              </div>
            </div>
          </div>
          
          {/* ✅ Reviews Section */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Customer Reviews
                </h2>
                <RatingSummary vehicleId={vehicle.id} />
              </div>
            </div>
            <ReviewsList vehicleId={vehicle.id} />
          </div>
        </div>
        
        {/* Right: Booking Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <BookingPanel vehicle={vehicle} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
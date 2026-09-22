// frontend/src/pages/customer/BookingDetails.jsx (UPDATED with Review)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  ChevronLeft, 
  Car,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  RefreshCw,
  Star,
  MessageSquare
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingById, cancelBooking } from '../../features/bookings/bookingSlice';
import paymentService from '../../services/paymentService';
import reviewService from '../../services/reviewService';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ReviewForm from '../../components/reviews/ReviewForm';
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters';
import { toast } from 'react-toastify';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentBooking, isLoading, error: sliceError } = useSelector((state) => state.bookings);
  
  const [imgError, setImgError] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchBookingById(id));
      checkReviewEligibility(id);
    }
  }, [dispatch, id]);
  
  // ✅ Check if user can review this booking
  const checkReviewEligibility = async (bookingId) => {
    try {
      const result = await reviewService.checkCanReview(bookingId);
      console.log('🔍 Review eligibility:', result.data);
      setCanReview(result.data?.canReview || false);
      
      if (result.data?.reason === 'You have already reviewed this booking') {
        setReviewSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to check review eligibility:', error);
      setCanReview(false);
    }
  };
  
  const handleReviewSuccess = () => {
    setReviewSubmitted(true);
    setShowReviewForm(false);
    toast.success('Thank you for your review!');
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchBookingById(id));
    checkReviewEligibility(id);
    setRefreshing(false);
    toast.success('Refreshed');
  };
  
  const handleCancel = async () => {
    setCancelLoading(true);
    setActionError('');
    
    try {
      const result = await dispatch(cancelBooking({ 
        id, 
        reason: 'Cancelled by customer' 
      })).unwrap();
      
      if (result.refund) {
        toast.success(
          `Booking cancelled! Refund: ৳${result.refund.refundAmount.toLocaleString()} (${result.refund.refundPercent}%)`
        );
      } else {
        toast.success('Booking cancelled successfully');
      }
      
      setShowCancelModal(false);
      dispatch(fetchBookingById(id));
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Cancellation failed';
      setActionError(message);
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };
  
  const handlePayNow = async () => {
    setPaymentLoading(true);
    setActionError('');
    
    try {
      const response = await paymentService.initiate(id);
      const { gatewayUrl } = response.data || response;
      
      if (gatewayUrl) {
        window.location.href = gatewayUrl;
      } else {
        setActionError('Payment gateway URL not found');
        toast.error('Payment gateway URL not found');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Payment initiation failed';
      setActionError(message);
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (sliceError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState
          title="Failed to Load Booking"
          message={sliceError}
          onRetry={() => dispatch(fetchBookingById(id))}
        />
      </div>
    );
  }
  
  if (!currentBooking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Not Found</h2>
        <Link to="/bookings" className="text-blue-600 hover:underline">
          ← Back to Bookings
        </Link>
      </div>
    );
  }
  
  const booking = currentBooking;
  const vehicleImage = booking.vehicle_image || booking.primary_image;
  const vehicleName = booking.brand === booking.model 
    ? `${booking.brand} ${booking.year}` 
    : `${booking.brand} ${booking.model} ${booking.year}`;
  
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';
  const isOngoing = booking.status === 'ongoing';
  const isPending = booking.status === 'pending_payment';
  const isConfirmed = booking.status === 'confirmed';
  const canCancel = booking.canCancel === true;
  const refundInfo = booking.cancellationInfo;
  
  const getStatusVariant = (status) => {
    const variants = {
      'pending_payment': 'warning',
      'confirmed': 'success',
      'ongoing': 'info',
      'completed': 'success',
      'cancelled': 'danger',
      'expired': 'danger',
    };
    return variants[status] || 'default';
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/bookings')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Bookings
      </button>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Booking Details</h1>
          <p className="text-sm text-slate-500">Booking ID: {booking.id?.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant={getStatusVariant(booking.status)}>
            {formatStatus(booking.status)}
          </Badge>
        </div>
      </div>
      
      {/* Action Error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Vehicle Card */}
          <Card className="flex items-center gap-4">
            <div className="w-32 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
              {!imgError && vehicleImage ? (
                <img
                  src={vehicleImage}
                  alt={vehicleName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Car className="w-10 h-10" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900">{vehicleName}</h3>
              <p className="text-sm text-slate-500 capitalize">
                {booking.vehicle_type} • {booking.transmission} • {booking.fuel_type}
              </p>
            </div>
          </Card>
          
          {/* Dates */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Trip Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Pickup Date</p>
                <p className="font-medium text-slate-900">{formatDate(booking.pickup_date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Return Date</p>
                <p className="font-medium text-slate-900">{formatDate(booking.return_date)}</p>
              </div>
            </div>
          </Card>
          
          {/* ✅ REVIEW SECTION - ADDED HERE */}
          {isCompleted && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Review Your Experience
              </h3>
              
              {reviewSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Review Submitted!
                  </h4>
                  <p className="text-slate-500">
                    Thank you for sharing your experience.
                  </p>
                </div>
              ) : canReview && !showReviewForm ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    How was your experience?
                  </h4>
                  <p className="text-slate-500 mb-6">
                    Share your feedback about the vehicle and service
                  </p>
                  <Button onClick={() => setShowReviewForm(true)}>
                    <Star className="w-4 h-4 mr-2" />
                    Write a Review
                  </Button>
                </div>
              ) : showReviewForm ? (
                <ReviewForm
                  bookingId={booking.id}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewForm(false)}
                />
              ) : null}
            </Card>
          )}
          
          {/* Price */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Rental Amount</span>
                <span className="text-slate-900 font-medium">{formatCurrency(booking.rental_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Security Deposit</span>
                <span className="text-slate-900 font-medium">{formatCurrency(booking.deposit_amount_snapshot)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between">
                <span className="text-slate-900 font-semibold">Total</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
            
            {isPending && (
              <Button
                fullWidth
                variant="primary"
                onClick={handlePayNow}
                isLoading={paymentLoading}
              >
                💳 Pay Now
              </Button>
            )}
            
            {canCancel && (
              <Button
                fullWidth
                variant="danger"
                onClick={() => setShowCancelModal(true)}
                isLoading={cancelLoading}
                className={isPending ? 'mt-2' : ''}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Booking
              </Button>
            )}
            
            {isCompleted && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Rental completed
                </p>
              </div>
            )}
            
            <Link to="/vehicles" className="block mt-3">
              <Button fullWidth variant="outline">
                Browse More Cars
              </Button>
            </Link>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Secure Booking</p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Cancel Modal */}
      {showCancelModal && refundInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Booking?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Pickup on {formatDate(booking.pickup_date)}
            </p>
            
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Refund</span>
                <span className="text-green-600 font-medium">{refundInfo.refundPercent}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{refundInfo.message}</p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => setShowCancelModal(false)}
              >
                Keep Booking
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                onClick={handleCancel}
                isLoading={cancelLoading}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
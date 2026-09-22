// frontend/src/pages/BookingSuccess.jsx

import { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Star, MessageSquare } from 'lucide-react';
import BookingStepper from '../../components/booking/BookingStepper';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { bookingSteps } from '../../mocks/booking';
import bookingService from '../../services/bookingService';
import ReviewForm from '../../components/reviews/ReviewForm';
import reviewService from '../../services/reviewService';
import { toast } from 'react-toastify';

const BookingSuccess = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  const tranId = searchParams.get('tran_id');
  const urlBookingId = searchParams.get('booking_id');
  
  useEffect(() => {
    console.log('🔍 BookingSuccess Debug:', {
      urlBookingId,
      tranId,
      stateBookingId: location.state?.bookingId,
      stateBooking: location.state?.booking,
      localStorage: localStorage.getItem('currentBookingId')
    });
    
    // ✅ Get booking ID from multiple sources
    let finalBookingId = urlBookingId || 
                         location.state?.bookingId || 
                         location.state?.booking?.id ||
                         localStorage.getItem('currentBookingId');
    
    console.log('✅ Final booking ID:', finalBookingId);
    
    // ✅ Only fetch if valid ID
    if (finalBookingId && finalBookingId !== 'undefined' && finalBookingId !== 'null') {
      fetchBookingDetails(finalBookingId);
    } else if (tranId) {
      // No booking ID but have transaction ID - show success anyway
      setLoading(false);
      setBooking({
        id: null,
        transaction_id: tranId,
        status: 'confirmed',
      });
    } else {
      setLoading(false);
      setError('Booking information not found');
    }
    
    // Cleanup localStorage
    return () => {
      localStorage.removeItem('currentBookingId');
      localStorage.removeItem('currentTotalAmount');
    };
  }, []);
  
  const fetchBookingDetails = async (id) => {
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ Invalid booking ID:', id);
      setError('Invalid booking ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Fetching booking:', id);
      const response = await bookingService.getById(id);
      const bookingData = response.data || response;
      setBooking(bookingData);
      
      // Check review eligibility
      if (bookingData?.id) {
        checkReviewEligibility(bookingData.id);
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      // Don't show error - just show success with what we have
      setBooking({
        id: id,
        transaction_id: tranId,
        status: 'confirmed',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const checkReviewEligibility = async (id) => {
    try {
      const result = await reviewService.checkCanReview(id);
      setCanReview(result.data?.canReview || false);
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <BookingStepper currentStep={5} steps={bookingSteps} />
        
        {error ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something Went Wrong</h1>
            <p className="text-slate-500 mb-6">{error}</p>
            <Link to="/bookings">
              <Button>View My Bookings</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-slate-500">
                Your booking has been successfully confirmed.
              </p>
            </div>
            
            {booking && (
              <Card className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Booking ID</p>
                    <p className="font-mono text-sm font-medium text-slate-900">
                      {booking.id?.slice(0, 8) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
                    <p className="font-mono text-sm font-medium text-slate-900">
                      {tranId || booking.transaction_id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Confirmed
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Paid</p>
                    <p className="text-xl font-bold text-slate-900">
                      ৳{Number(booking.total_amount || 0).toLocaleString('en-BD')}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Review Section - Only show if booking is completed */}
            {booking && booking.status === 'completed' && (
              <Card className="mb-6">
                {reviewSubmitted ? (
                  <div className="text-center py-8">
                    <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4 fill-yellow-400" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Review Submitted!
                    </h2>
                    <p className="text-slate-600">
                      Thank you for sharing your experience!
                    </p>
                  </div>
                ) : canReview && !showReviewForm ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      How was your experience?
                    </h2>
                    <p className="text-slate-600 mb-6">
                      Share your feedback about the vehicle
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
            
            <div className="flex gap-4">
              <Link to="/bookings" className="flex-1">
                <Button fullWidth variant="primary">
                  View My Bookings
                </Button>
              </Link>
              <Link to="/vehicles" className="flex-1">
                <Button fullWidth variant="outline">
                  Browse More Cars
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingSuccess;
// frontend/src/pages/BookingConfirm.jsx

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import BookingStepper from '../../components/booking/BookingStepper';
import BookingSummary from '../../components/booking/BookingSummary';
import PriceBreakdown from '../../components/booking/PriceBreakdown';
import Button from '../../components/ui/Button';
import { bookingSteps } from '../../mocks/booking';
import bookingService from '../../services/bookingService';
import { toast } from 'react-toastify';

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const bookingData = location.state;

  console.log('🔍 Full bookingData:', bookingData);

  if (!bookingData || !bookingData.vehicle) {
    console.error('❌ No booking data found');
    toast.error('Booking data missing. Please start over.');
    navigate('/vehicles');
    return null;
  }

  const { vehicle, pickupDate, returnDate, days, rentalAmount, totalAmount } = bookingData;
  const vehicleId = vehicle?.id;

  const handleProceedToPayment = async () => {
    if (!agreed) {
      toast.warning('Please agree to the terms and conditions');
      return;
    }

    if (!vehicleId) {
      toast.error('Vehicle ID is missing!');
      return;
    }

    if (!pickupDate || !returnDate) {
      toast.error('Please select pickup and return dates');
      return;
    }

    // ✅ Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: '/booking/confirm' } });
      return;
    }

    setApiError('');
    setIsLoading(true);

    try {
      const bookingPayload = {
        vehicleId: vehicleId,
        pickupDate: pickupDate,
        returnDate: returnDate,
        pickupTime: '10:00',
        returnTime: '10:00',
      };

      console.log('🔍 Sending to backend:', bookingPayload);

      const response = await bookingService.create(bookingPayload);
      console.log('✅ Full response:', response);

      const responseData = response?.data || response;
      const booking = responseData?.booking || responseData?.data?.booking || responseData;
      const bookingId = booking?.id || responseData?.bookingId || responseData?.data?.bookingId;

      console.log('✅ Booking ID:', bookingId);

      if (!bookingId) {
        toast.error('Booking created but ID not received.');
        navigate('/bookings');
        return;
      }

      localStorage.setItem('currentBookingId', bookingId);
      localStorage.setItem('currentTotalAmount', totalAmount);

      navigate('/booking/payment', {
        state: {
          ...bookingData,
          bookingId: bookingId,
          booking: booking,
        },
      });

    } catch (error) {
      console.error('❌ Error:', error);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response data:', error.response?.data);
      
      let errorMessage = 'Failed to create booking';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          toast.error(errorMessage);
          localStorage.removeItem('accessToken');
          navigate('/login');
          return;
        } else if (error.response.status === 403) {
          errorMessage = error.response.data?.message || 'KYC verification required. Please complete your KYC first.';
        } else if (error.response.status === 409) {
          errorMessage = '🚫 Vehicle already booked for these dates. Please choose different dates.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.errors) {
          errorMessage = error.response.data.errors.map(e => e.message).join(', ');
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Failed to create booking';
      }
      
      toast.error(errorMessage);
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <BookingStepper currentStep={3} steps={bookingSteps} />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Review Your Booking</h1>
          <p className="text-slate-500">Please review before proceeding</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BookingSummary
            vehicle={vehicle}
            pickupDate={pickupDate}
            returnDate={returnDate}
            days={days}
          />

          <div className="space-y-4">
            <PriceBreakdown
              dailyRate={vehicle?.daily_rate || 0}
              days={days}
              rentalAmount={rentalAmount}
              depositAmount={vehicle?.deposit_amount || 0}
              totalAmount={totalAmount}
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 mt-0.5"
              />
              <span className="text-sm text-slate-600">
                I agree to the Terms of Service and Rental Agreement
              </span>
            </label>

            <Button
              fullWidth
              size="lg"
              onClick={handleProceedToPayment}
              isLoading={isLoading}
            >
              {isLoading ? 'Creating Booking...' : 'Proceed to Payment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;
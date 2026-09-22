// frontend/src/pages/BookingPayment.jsx (UPDATED)
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';
import BookingStepper from '../../components/booking/BookingStepper';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { bookingSteps } from '../../mocks/booking';
import paymentService from '../../services/paymentService';
import bookingService from '../../services/bookingService';
import { toast } from 'react-toastify';

const BookingPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [bookingData, setBookingData] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    initializePaymentPage();
  }, []);

  const initializePaymentPage = async () => {
    try {
      const stateData = location.state || {};
      
      console.log('🔍 Location state:', stateData);
      
      // ✅ Get booking ID from multiple sources
      let finalBookingId = null;
      
      // 1. Check location state
      if (stateData.bookingId && stateData.bookingId !== 'undefined') {
        finalBookingId = stateData.bookingId;
      } else if (stateData.booking?.id && stateData.booking.id !== 'undefined') {
        finalBookingId = stateData.booking.id;
      }
      
      // 2. Check URL params
      if (!finalBookingId) {
        const urlBookingId = searchParams.get('booking_id');
        if (urlBookingId && urlBookingId !== 'undefined') {
          finalBookingId = urlBookingId;
        }
      }
      
      // 3. Check localStorage
      if (!finalBookingId) {
        const storedBookingId = localStorage.getItem('currentBookingId');
        if (storedBookingId && storedBookingId !== 'undefined' && storedBookingId !== 'null') {
          finalBookingId = storedBookingId;
        }
      }
      
      console.log('✅ Final booking ID:', finalBookingId);
      
      if (!finalBookingId) {
        toast.error('Booking ID not found. Please book again.');
        navigate('/vehicles');
        return;
      }
      
      setBookingId(finalBookingId);
      
      // ✅ Get total amount
      let finalTotal = 0;
      
      if (stateData.totalAmount && stateData.totalAmount > 0) {
        finalTotal = stateData.totalAmount;
      } else if (stateData.booking?.total_amount && stateData.booking.total_amount > 0) {
        finalTotal = stateData.booking.total_amount;
      } else {
        const storedTotal = localStorage.getItem('currentTotalAmount');
        if (storedTotal && Number(storedTotal) > 0) {
          finalTotal = Number(storedTotal);
        }
      }
      
      console.log('✅ Final total amount:', finalTotal);
      
      // ✅ If no amount, fetch booking details
      if (!finalTotal && finalBookingId) {
        try {
          const response = await bookingService.getById(finalBookingId);
          const bookingData = response.data || response;
          finalTotal = Number(bookingData.total_amount) || 0;
          console.log('✅ Fetched booking amount:', finalTotal);
        } catch (error) {
          console.error('Failed to fetch booking:', error);
        }
      }
      
      setTotalAmount(finalTotal);
      setBookingData(stateData);
      
    } catch (error) {
      console.error('❌ Error initializing payment page:', error);
      toast.error('Failed to load booking details');
    }
  };
  
  const handlePayNow = async () => {
    if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
      toast.error('Invalid booking ID. Please book again.');
      navigate('/vehicles');
      return;
    }

    setIsProcessing(true);
    setError('');
    setIsExpired(false);
    
    try {
      console.log('🔍 Initiating payment for booking:', bookingId);
      
      const response = await paymentService.initiate(bookingId);
      console.log('✅ Payment response:', response);
      
      // ✅ Extract gateway URL from different response formats
      const responseData = response?.data || response;
      const gatewayUrl = responseData?.gatewayUrl || 
                        responseData?.data?.gatewayUrl ||
                        response?.gatewayUrl ||
                        responseData?.GatewayPageURL ||
                        responseData?.data?.GatewayPageURL;
      
      console.log('✅ Gateway URL:', gatewayUrl);
      
      if (gatewayUrl) {
        // Save booking ID for success page
        localStorage.setItem('currentBookingId', bookingId);
        localStorage.setItem('currentTotalAmount', totalAmount.toString());
        
        // Redirect to gateway
        window.location.href = gatewayUrl;
      } else {
        throw new Error('Payment gateway URL not received');
      }
    } catch (error) {
      console.error('❌ Payment failed:', error);
      
      let message = error.response?.data?.message || error.message || 'Payment initiation failed';
      
      if (message.includes('expired') || message.includes('hold has expired')) {
        setIsExpired(true);
        message = '⏰ আপনার বুকিং হোল্ডের সময় শেষ হয়ে গেছে। দয়া করে নতুন করে বুক করুন।';
        localStorage.removeItem('currentBookingId');
        localStorage.removeItem('currentTotalAmount');
      }
      
      setError(message);
      toast.error(message);
      setIsProcessing(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Card className="p-8 border-yellow-200 bg-yellow-50">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Booking ID Missing</h2>
            <p className="text-slate-600 mb-4">Please go back and try again.</p>
            <Button onClick={() => navigate('/vehicles')}>
              Browse Cars
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Card className="p-8 border-red-200 bg-red-50">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">⏰ Booking Hold Expired</h2>
            <p className="text-red-600 mb-4">
              Your booking hold has expired. Please book again with new dates.
            </p>
            <Button onClick={() => navigate('/vehicles')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Book Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <BookingStepper currentStep={4} steps={bookingSteps} />
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Secure Payment</h1>
          <p className="text-slate-500">Your payment is protected with SSLCommerz</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Booking ID</span>
            <span className="font-mono font-medium">{bookingId?.slice(0, 8)}</span>
          </div>
          {bookingData?.vehicle && (
            <div className="flex justify-between mt-1">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-medium">{bookingData.vehicle.brand} {bookingData.vehicle.model}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center mb-6">
          <p className="text-sm text-slate-500 mb-2">Total Amount</p>
          <p className="text-4xl font-bold text-slate-900">
            ৳{Number(totalAmount).toLocaleString('en-BD')}
          </p>
        </div>
        
        <Button
          fullWidth
          size="lg"
          onClick={handlePayNow}
          isLoading={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay ৳${Number(totalAmount).toLocaleString('en-BD')}`}
        </Button>
        
        <div className="flex justify-center gap-6 mt-6">
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <Lock className="w-4 h-4 text-green-600" /> Secure Payment
          </span>
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <Shield className="w-4 h-4 text-green-600" /> SSLCommerz
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookingPayment;
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Calendar, Car, Download, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import api from '../../services/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('tran_id');
  const bookingId = searchParams.get('booking_id');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    } else {
      setLoading(false);
    }
  }, [bookingId]);
  
  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">✅ Payment Successful</h1>
        <p className="text-slate-500">Your booking has been confirmed!</p>
      </div>
      
      {/* Booking Summary */}
      {booking && (
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Car className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-slate-900">{booking.brand} {booking.model}</p>
              <p className="text-sm text-slate-500">{booking.year} • {booking.vehicle_type}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Pickup</p>
              <p className="font-medium">{formatDate(booking.pickup_date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Return</p>
              <p className="font-medium">{formatDate(booking.return_date)}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-bold text-blue-600">{formatCurrency(booking.total_amount)}</span>
            </div>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span className="font-medium">Booking ID:</span> {booking.id?.slice(0, 8)}
            </div>
            <div>
              <span className="font-medium">Transaction:</span> {transactionId?.slice(0, 12)}
            </div>
          </div>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link to={`/bookings/${bookingId || ''}`} className="block">
          <Button fullWidth>
            <Eye className="w-4 h-4 mr-2" />
            View Booking
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button fullWidth variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Link to="/vehicles" className="flex-1">
            <Button fullWidth variant="outline">
              Browse More Cars
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
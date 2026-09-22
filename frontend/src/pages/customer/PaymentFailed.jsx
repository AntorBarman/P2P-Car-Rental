import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, Car } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get('reason') || 'Payment was declined by the gateway.';
  const bookingId = searchParams.get('booking_id');
  
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">✕ Payment Failed</h1>
        <p className="text-slate-500">We couldn't complete your payment.</p>
      </div>
      
      <Card className="p-5 mb-4">
        <p className="text-sm text-slate-600 text-center">{reason}</p>
        <p className="text-xs text-slate-400 text-center mt-2">
          Your vehicle hold will expire in 10 minutes. You can try again.
        </p>
      </Card>
      
      <div className="flex flex-col gap-3">
        <Button 
          fullWidth 
          variant="primary"
          onClick={() => navigate(`/booking/payment?booking_id=${bookingId}`)}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <div className="flex gap-3">
          <Link to="/vehicles" className="flex-1">
            <Button fullWidth variant="outline">
              <Car className="w-4 h-4 mr-2" />
              Browse Cars
            </Button>
          </Link>
          <Link to="/support" className="flex-1">
            <Button fullWidth variant="outline">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
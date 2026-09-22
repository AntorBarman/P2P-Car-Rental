import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setLoading(false);
      setError('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      setSuccess(true);
      toast.success('✅ Email verified successfully! You can now login.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.warning('Please enter your email');
      return;
    }

    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('✅ Verification email sent successfully!');
      setError(null);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification email';
      toast.error(message);
      setError(message);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        <Card className="p-8 text-center">
          {success ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">✅ Email Verified!</h1>
              <p className="text-slate-600 mb-6">
                Your email has been successfully verified. You can now login to your account.
              </p>
              <Link to="/login">
                <Button fullWidth>Go to Login</Button>
              </Link>
            </>
          ) : error && error.includes('expired') ? (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">⏰ Link Expired</h1>
              <p className="text-slate-600 mb-6">
                Your verification link has expired. Enter your email below to receive a new one.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  fullWidth 
                  onClick={handleResend} 
                  isLoading={resending}
                >
                  Resend Verification Email
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">❌ Verification Failed</h1>
              <p className="text-slate-600 mb-6">{error || 'Something went wrong'}</p>
              <div className="space-y-3">
                <Link to="/login">
                  <Button fullWidth variant="outline">Back to Login</Button>
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
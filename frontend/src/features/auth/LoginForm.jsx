// frontend/src/features/auth/LoginForm.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Copy, 
  CheckCircle,
  User,
  Car,
  Shield,
  Zap,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { isValidEmail } from '../../utils/validators';
import { login } from './authSlice';
import { toast } from 'react-toastify';

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error: apiError } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(null);

  // ✅ Test Credentials
  const testAccounts = [
    {
      role: 'Customer',
      label: '🚗 Rent a Car',
      email: 'antorbr320@gmail.com',
      password: 'Renter@.com',
      icon: User,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      role: 'Owner',
      label: '📋 List My Car',
      email: 'barmanantor721@gmail.com',
      password: 'Owner@.com',
      icon: Car,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
      role: 'Admin',
      label: '🛡️ Admin Panel',
      email: 'admin@udrivebd.com',
      password: 'Admin@.com',
      icon: Shield,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Auto-fill credentials
  const handleFillCredentials = (account) => {
    setFormData({
      email: account.email,
      password: account.password,
    });
    setErrors({});
    toast.info(`${account.role} credentials filled!`);
  };

  // ✅ Copy credentials
  const handleCopy = (account) => {
    navigator.clipboard.writeText(`${account.email} | ${account.password}`);
    setCopied(account.role);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      const user = result.payload.user;

      if (user.role === 'admin' || user.role === 'staff') {
        navigate('/admin');
      } else if (user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ✅ Test Credentials Box */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-bold text-slate-900">
            🎯 Demo Test Accounts
          </h3>
          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            Testing Only
          </span>
        </div>

        <div className="space-y-2">
          {testAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <div
                key={account.role}
                className={`${account.bgColor} border ${account.borderColor} rounded-lg p-2.5`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${account.textColor}`} />
                    <span className={`text-xs font-bold ${account.textColor}`}>
                      {account.label}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {/* Fill Button */}
                    <button
                      type="button"
                      onClick={() => handleFillCredentials(account)}
                      className={`text-[10px] px-2 py-1 ${account.buttonColor} text-white rounded font-medium transition`}
                    >
                      Use
                    </button>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(account)}
                      className="text-[10px] px-2 py-1 bg-white text-slate-600 rounded font-medium border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      {copied === account.role ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] font-mono text-slate-600 truncate">
                    <span className="text-slate-400">📧</span> {account.email}
                  </p>
                  <p className="text-[10px] font-mono text-slate-600">
                    <span className="text-slate-400">🔑</span> {account.password}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-500 mt-2 text-center">
          ⚠️ Demo credentials — for testing only. Remove in production.
        </p>
      </div>

      {/* ✅ API Error */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* ✅ Email Input */}
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        icon={Mail}
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        required
      />

      {/* ✅ Password Input */}
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          required
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-slate-100"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* ✅ Submit Button */}
      <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
        Sign In
      </Button>

      {/* ✅ Register Link */}
      <p className="text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 font-medium hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
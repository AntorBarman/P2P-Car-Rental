import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from '../../features/auth/LoginForm';
import { useLocation } from 'react-router-dom';

const Login = () => {
  const location = useLocation();
  const message = location.state?.message;
  
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your journey with UDrive"
    >
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm mb-4">
          {message}
        </div>
      )}
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
import AuthLayout from '../../layouts/AuthLayout';
import RegisterForm from '../../features/auth/RegisterForm';

const Register = () => {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join UDrive as a customer or vehicle owner"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
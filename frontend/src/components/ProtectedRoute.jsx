import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, accessToken, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Not authenticated
  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
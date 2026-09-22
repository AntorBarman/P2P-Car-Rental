import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  User,
  Shield,
  LogOut,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';

const CustomerSidebar = ({ user }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Car, label: 'Browse Cars', path: '/vehicles' },
    { icon: Calendar, label: 'My Bookings', path: '/bookings' },
    { icon: Shield, label: 'KYC Verification', path: '/kyc' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];
  
  const isActive = (path) => 
    location.pathname === path || location.pathname.startsWith(path + '/');
  
  const handleLogout = async () => {
    await dispatch(logout());
  };
  
  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            UDrive<span className="text-blue-600">BD</span>
          </span>
        </Link>
      </div>
      
      {/* User Info */}
      <div className="p-4 border-b border-slate-100 bg-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="font-semibold text-blue-600">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-blue-600">Customer</p>
          </div>
        </div>
      </div>
      
      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;
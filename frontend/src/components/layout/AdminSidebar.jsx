import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Wallet,
  Users,
  Shield,
  FileText,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';

const AdminSidebar = ({ user }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Car, label: 'Vehicle Approvals', path: '/admin/vehicles' },
    { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
    { icon: Wallet, label: 'Payments', path: '/admin/payments' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Shield, label: 'KYC Reviews', path: '/admin/kyc' },
    { icon: TrendingUp, label: 'Reports', path: '/admin/reports' },
  ];
  
  const isActive = (path) => 
    location.pathname === path || location.pathname.startsWith(path + '/');
  
  return (
    <aside className="w-64 bg-slate-900 text-white fixed inset-y-0 left-0 z-30 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            UDrive<span className="text-blue-400">BD</span>
          </span>
          <Badge variant="danger" size="sm">Admin</Badge>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 text-sm text-red-400 hover:bg-red-900/50 px-3 py-2 rounded-lg w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
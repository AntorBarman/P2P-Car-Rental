import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Wallet,
  Plus,
  FileText,
  LogOut,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';

const OwnerSidebar = ({ user }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/owner' },
    { icon: Car, label: 'My Vehicles', path: '/owner/vehicles' },
    { icon: Plus, label: 'Add Vehicle', path: '/owner/vehicles/new' },
    { icon: Calendar, label: 'Bookings', path: '/owner/bookings' },
    { icon: Wallet, label: 'Earnings', path: '/owner/earnings' },
    { icon: FileText, label: 'Documents', path: '/owner/documents' },
  ];
  
  const isActive = (path) => 
    location.pathname === path || location.pathname.startsWith(path + '/');
  
  return (
    <aside className="w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">UDrive<span className="text-green-600">BD</span></span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-green-50 text-green-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default OwnerSidebar;
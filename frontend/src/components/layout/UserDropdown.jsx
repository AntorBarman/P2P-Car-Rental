import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  Wallet, 
  Plus, 
  Shield,
  Car,
  Calendar,
  Users,
  TrendingUp,
  FileText,
} from 'lucide-react';
import Badge from '../ui/Badge';

const UserDropdown = ({ user, onClose }) => {
  const handleLogout = () => {
    onClose?.();
  };
  
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'owner': return 'success';
      case 'customer': return 'primary';
      default: return 'default';
    }
  };
  
  return (
    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
      {/* User Info */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="font-semibold text-slate-900">{user?.name}</p>
        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        <Badge variant={getRoleBadgeVariant(user?.role)} size="sm" className="mt-2">
          {user?.role}
        </Badge>
      </div>
      
      {/* ============ CUSTOMER LINKS ============ */}
      {user?.role === 'customer' && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            to="/bookings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Calendar className="w-4 h-4" /> My Bookings
          </Link>
          <Link
            to="/vehicles"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Car className="w-4 h-4" /> Browse Cars
          </Link>
        </>
      )}
      
      {/* ============ OWNER LINKS ============ */}
      {user?.role === 'owner' && (
        <>
          <Link
            to="/owner"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <LayoutDashboard className="w-4 h-4" /> Owner Dashboard
          </Link>
          <Link
            to="/owner/vehicles"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Car className="w-4 h-4" /> My Vehicles
          </Link>
          <Link
            to="/owner/vehicles/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Plus className="w-4 h-4" /> Add New Vehicle
          </Link>
          <Link
            to="/owner/earnings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Wallet className="w-4 h-4" /> Earnings & Wallet
          </Link>
        </>
      )}
      
      {/* ============ ADMIN LINKS ============ */}
      {user?.role === 'admin' && (
        <>
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Shield className="w-4 h-4" /> Admin Control Panel
          </Link>
          <Link
            to="/admin/vehicles"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Car className="w-4 h-4" /> Vehicle Approvals
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Users className="w-4 h-4" /> Manage Users
          </Link>
          <Link
            to="/admin/bookings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <Calendar className="w-4 h-4" /> Booking Monitor
          </Link>
        </>
      )}
      
      {/* Common Links */}
      <hr className="my-1" />
      
      <Link
        to="/profile"
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        onClick={onClose}
      >
        <User className="w-4 h-4" /> Profile Settings
      </Link>
      
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
};

export default UserDropdown;
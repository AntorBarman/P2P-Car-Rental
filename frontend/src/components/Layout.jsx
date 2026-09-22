import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Car,
  Home,
  User,
  LogOut,
  Settings,
  Bell,
  Calendar,
  CreditCard,
  Shield,
  FileText,
  BarChart3,
  Users,
  MapPin,
  ChevronDown,
  PlusCircle,
  Wallet,
  LayoutDashboard
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { logout } from '../features/auth/authSlice';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // ✅ Navigation items based on role
  const getNavItems = () => {
    const items = [];

    if (user?.role === 'admin' || user?.role === 'staff') {
      items.push(
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Car, label: 'Vehicles', path: '/admin/vehicles' },
        { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Shield, label: 'KYC Reviews', path: '/admin/kyc' },
        { icon: FileText, label: 'Vehicle Documents', path: '/admin/vehicles/documents' },
        { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
        { icon: Wallet, label: 'Wallets', path: '/admin/wallets' },
        { icon: MapPin, label: 'Branches', path: '/admin/branches' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      );
    } else if (user?.role === 'owner') {
      items.push(
        { icon: LayoutDashboard, label: 'Dashboard', path: '/owner/dashboard' },
        { icon: Car, label: 'My Vehicles', path: '/owner/vehicles' },
        { icon: PlusCircle, label: 'Add Vehicle', path: '/owner/vehicles/create' },
        { icon: Calendar, label: 'Rental Orders', path: '/owner/bookings' },
        { icon: Wallet, label: 'Earnings', path: '/owner/earnings' },
        { icon: Shield, label: 'KYC', path: '/owner/kyc' },
        { icon: FileText, label: 'Vehicle Documents', path: '/owner/vehicle-documents' },
      );
    } else if (user?.role === 'customer') {
      items.push(
        { icon: Home, label: 'Home', path: '/' },
        { icon: Car, label: 'Browse Cars', path: '/vehicles' },
        { icon: Calendar, label: 'My Bookings', path: '/bookings' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: Shield, label: 'KYC', path: '/kyc' },
        { icon: User, label: 'Profile', path: '/profile' },
      );
    }

    return items;
  };

  const navItems = getNavItems();

  // ✅ Check if path is active
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">UDriveBD</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-200">
          <p className="font-medium text-slate-900">{user?.name || 'User'}</p>
          <p className="text-sm text-slate-500 capitalize">{user?.role || 'Guest'}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 h-16">
            {/* Left: Menu Toggle + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
                {navItems.find((item) => isActive(item.path))?.label || 'UDriveBD'}
              </h1>
            </div>

            {/* Right: NotificationBell + Profile */}
            <div className="flex items-center gap-3">
              {/* ✅ NOTIFICATION BELL - ADDED HERE */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Menu, 
  X, 
  Car, 
  ChevronDown,
  LayoutDashboard,
  Wallet,
  User,
  LogOut,
  Calendar,
  Bell,
  Plus,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { logout } from '../../features/auth/authSlice';
import NotificationBell from '../NotificationBell'; // ✅ ADD THIS IMPORT

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const isAuthenticated = !!user;
  const role = user?.role || 'public';
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = async () => {
    await dispatch(logout());
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  // ✅ Avatar Component
  const UserAvatar = ({ size = 'sm' }) => {
    const sizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
    
    if (user?.avatar_url) {
      return (
        <img 
          src={user.avatar_url} 
          alt={user?.name || 'User'} 
          className={`${sizeClasses} rounded-full object-cover shrink-0`}
          crossOrigin="anonymous"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      );
    }
    
    return (
      <div className={`${sizeClasses} bg-blue-100 rounded-full flex items-center justify-center shrink-0`}>
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-semibold text-blue-600`}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </span>
      </div>
    );
  };
  
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { label: 'Vehicles', path: '/admin/vehicles', icon: Car },
          { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
        ];
      case 'owner':
        return [
          { label: 'Dashboard', path: '/owner', icon: LayoutDashboard },
          { label: 'My Vehicles', path: '/owner/vehicles', icon: Car },
          { label: 'Add Vehicle', path: '/owner/vehicles/new', icon: Plus },
          { label: 'Earnings', path: '/owner/earnings', icon: TrendingUp },
        ];
      case 'customer':
        return [
          { label: 'Vehicles', path: '/vehicles', icon: Car },
          { label: 'My Bookings', path: '/bookings', icon: Calendar },
        ];
      default:
        return [
          { label: 'Vehicles', path: '/vehicles', icon: Car },
          { label: 'How It Works', path: '/how-it-works', icon: HelpCircle },
          { label: 'Become Owner', path: '/become-owner', icon: Car },
        ];
    }
  };
  
  const navLinks = getNavLinks();
  
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'owner': return 'success';
      case 'customer': return 'primary';
      default: return 'default';
    }
  };
  
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm border-b border-slate-200'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                UDrive<span className="text-blue-600">BD</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path) ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Right Side */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* ✅ REPLACE static Bell with NotificationBell */}
                  <NotificationBell />
                  
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-1.5 hover:bg-slate-100 rounded-lg px-2 py-1.5"
                    >
                      <UserAvatar size="sm" />
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                        {/* User Info with Avatar */}
                        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                          <UserAvatar size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{user?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                            <Badge variant={getRoleBadgeVariant(user?.role)} size="xs" className="mt-1 capitalize">
                              {user?.role}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Links */}
                        {role === 'customer' && (
                          <>
                            <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                            </Link>
                            <Link to="/bookings" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                              <Calendar className="w-3.5 h-3.5" /> My Bookings
                            </Link>
                          </>
                        )}
                        
                        {role === 'owner' && (
                          <>
                            <Link to="/owner" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                            </Link>
                            <Link to="/owner/vehicles" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                              <Car className="w-3.5 h-3.5" /> My Vehicles
                            </Link>
                          </>
                        )}
                        
                        {role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard className="w-3.5 h-3.5" /> Admin Panel
                          </Link>
                        )}
                        
                        <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-3.5 h-3.5" /> Profile Settings
                        </Link>
                        
                        <hr className="my-1" />
                        
                        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left">
                          <LogOut className="w-3.5 h-3.5" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
              
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
                <Menu className="w-6 h-6 text-slate-700" />
              </button>
            </div>
          </div>
        </nav>
      </header>
      
      <div className="h-16" />
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">UDrive<span className="text-blue-600">BD</span></span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile User Info with Avatar */}
            {isAuthenticated && (
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <UserAvatar size="md" />
                <div>
                  <p className="font-medium text-sm">{user?.name}</p>
                  <Badge variant={getRoleBadgeVariant(user?.role)} size="xs" className="mt-0.5 capitalize">{user?.role}</Badge>
                </div>
              </div>
            )}
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive(link.path) ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              
              <hr className="my-2" />
              
              {isAuthenticated ? (
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg border border-slate-200 text-center font-medium">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg bg-blue-600 text-center text-white font-medium">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
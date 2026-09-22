import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar,
  Wallet,
  Plus,
  FileText,
  Shield,
  LogOut,
  Menu,
  Bell,           // ✅ ADDED
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  Lock,
  Banknote,
  Clock,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import Badge from '../components/ui/Badge';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';

const OwnerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [kycApproved, setKycApproved] = useState(false);
  const userMenuRef = useRef(null);
  
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
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
    checkKycStatus();
  }, []);
  
  const checkKycStatus = async () => {
    try {
      const response = await api.get('/documents/my');
      const docs = response.data.data || [];
      const approvedCount = docs.filter((d) => d.status === 'approved').length;
      setKycApproved(approvedCount >= 2);
    } catch (error) {
      setKycApproved(false);
    }
  };
  
  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/owner' },
      ],
    },
    {
      label: 'FLEET',
      items: [
        { icon: Car, label: 'My Vehicles', path: '/owner/vehicles' },
        { icon: Plus, label: 'Add Vehicle', path: '/owner/vehicles/new', locked: !kycApproved },
      ],
    },
    {
      label: 'RENTALS',
      items: [
        { icon: Calendar, label: 'Rental Orders', path: '/owner/bookings' },
        { icon: Clock, label: 'Calendar', path: '/owner/calendar' },
      ],
    },
    {
      label: 'FINANCE',
      items: [
        { icon: Wallet, label: 'Earnings', path: '/owner/earnings' },
        { icon: Banknote, label: 'Payouts', path: '/owner/payouts' },
      ],
    },
    {
      label: 'VERIFICATION',
      items: [
        { icon: Shield, label: 'KYC', path: '/owner/documents' },
        { icon: FileText, label: 'Vehicle Documents', path: '/owner/vehicle-documents' },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { icon: Bell, label: 'Notifications', path: '/owner/notifications' },
        { icon: Settings, label: 'Settings', path: '/owner/settings' },
      ],
    },
  ];
  
  const isActive = (path) => 
    location.pathname === path || location.pathname.startsWith(path + '/');
  
  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };
  
  // Avatar Component
  const UserAvatar = ({ size = 'sm' }) => {
    const sizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
    
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
      <div className={`${sizeClasses} bg-green-100 rounded-full flex items-center justify-center shrink-0`}>
        <span className="text-xs font-semibold text-green-600">
          {user?.name?.[0]?.toUpperCase() || 'O'}
        </span>
      </div>
    );
  };
  
  const SidebarContent = () => (
    <aside className="w-60 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Logo */}
      <div className="p-3 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            UDrive<span className="text-green-600">BD</span>
          </span>
        </Link>
      </div>
      
      {/* KYC Banner */}
      {!kycApproved && (
        <div className="p-2 border-b border-yellow-200 bg-yellow-50">
          <Link to="/owner/documents" className="flex items-center gap-1.5 text-[10px] text-yellow-700">
            <Lock className="w-3 h-3" />
            KYC pending — complete verification
          </Link>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 py-1 text-[9px] font-semibold text-slate-400 tracking-wider uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.locked ? '/owner/documents' : item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-green-50 text-green-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    } ${item.locked ? 'opacity-50' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.locked && <Lock className="w-3 h-3 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* User Info */}
      <div className="p-2 border-t border-slate-200">
        <Link to="/owner/settings" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
          <UserAvatar size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400">Owner</p>
          </div>
        </Link>
      </div>
    </aside>
  );
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-60">
        <SidebarContent />
      </div>
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">
            <SidebarContent />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="lg:ml-60">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg shrink-0">
                <Menu className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {navGroups.flatMap((g) => g.items).find((item) => isActive(item.path))?.label || 'Owner Dashboard'}
              </p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {/* ✅ Notification Bell */}
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
                  <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                      <UserAvatar size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        <Badge variant="success" size="xs" className="mt-1">Owner</Badge>
                      </div>
                    </div>
                    
                    <Link to="/owner/settings" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                      <Settings className="w-3.5 h-3.5" /> Account Settings
                    </Link>
                    <Link to="/owner/notifications" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                      <Bell className="w-3.5 h-3.5" /> Notifications
                    </Link>
                    <Link to="/help" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                      <HelpCircle className="w-3.5 h-3.5" /> Help Center
                    </Link>
                    
                    <hr className="my-1" />
                    
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-3 sm:p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
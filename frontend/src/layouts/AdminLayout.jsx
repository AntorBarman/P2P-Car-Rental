import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Wallet,
  Users,
  Shield,
  LogOut,
  Menu,
  ChevronDown,
  User,
  Settings,
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MapPin,
  UserCheck,
  CarFront,
  Wallet2,
  Banknote,
  UserCog,
  ScrollText,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import Badge from '../components/ui/Badge';
import NotificationBell from '../components/NotificationBell'; // ✅ Import

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
  
  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/reports' },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
        { icon: Car, label: 'Vehicles', path: '/admin/vehicles' },
        { icon: MapPin, label: 'Branches', path: '/admin/branches' },
      ],
    },
    {
      label: 'VERIFICATION',
      items: [
        { icon: Shield, label: 'KYC Reviews', path: '/admin/kyc' },
        { icon: CarFront, label: 'Vehicle Documents', path: '/admin/vehicle-documents' },
      ],
    },
    {
      label: 'FINANCE',
      items: [
        { icon: Wallet, label: 'Payments', path: '/admin/payments' },
        { icon: Wallet2, label: 'Wallets', path: '/admin/wallets' },
        { icon: Banknote, label: 'Commissions', path: '/admin/commissions' },
      ],
    },
    {
      label: 'USERS',
      items: [
        { icon: Users, label: 'Customers', path: '/admin/users?role=customer' },
        { icon: UserCheck, label: 'Vehicle Owners', path: '/admin/users?role=owner' },
        { icon: UserCog, label: 'Staff', path: '/admin/users?role=staff' },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { icon: ScrollText, label: 'Audit Logs', path: '/admin/audit-logs' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
      ],
    },
  ];
  
  const isActive = (path) => 
    location.pathname === path || location.pathname.startsWith(path.split('?')[0] + '/');
  
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
          alt={user?.name || 'Admin'} 
          className={`${sizeClasses} rounded-full object-cover shrink-0`}
          crossOrigin="anonymous"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      );
    }
    
    return (
      <div className={`${sizeClasses} bg-blue-600 rounded-full flex items-center justify-center shrink-0`}>
        <span className="text-xs font-semibold text-white">
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </span>
      </div>
    );
  };
  
  const SidebarContent = () => (
    <aside className={`h-full flex flex-col bg-slate-900 text-white transition-all duration-200 ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      {/* Logo */}
      <div className={`p-3 border-b border-slate-700 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">UDrive<span className="text-blue-400">BD</span></span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && <Badge variant="danger" size="xs">Admin</Badge>}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <p className="px-3 py-1.5 text-[9px] font-semibold text-slate-500 tracking-wider uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.label : ''}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 border-t border-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
      
      {/* Status */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-slate-700 flex items-center gap-2">
          <Activity className="w-3 h-3 text-green-400" />
          <span className="text-[10px] text-slate-500">Operational</span>
        </div>
      )}
    </aside>
  );
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
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
      
      {/* Main */}
      <div className={`transition-all duration-200 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg shrink-0">
                <Menu className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold text-slate-900">
                {navGroups.flatMap((g) => g.items).find((item) => isActive(item.path))?.label || 'Admin'}
              </p>
            </div>
            
            {/* Search */}
            <div className="hidden md:block flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users, vehicles, bookings..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            
            {/* Right */}
            <div className="flex items-center gap-1 shrink-0">
              {/* ✅ Notification Bell */}
              <NotificationBell />
              
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1.5 hover:bg-slate-100 rounded-lg px-2 py-1.5">
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
                        <Badge variant="danger" size="xs" className="mt-1">Admin</Badge>
                      </div>
                    </div>
                    
                    <Link to="/admin/settings" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                      <Settings className="w-3.5 h-3.5" /> System Settings
                    </Link>
                    <Link to="/admin/audit-logs" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                      <ScrollText className="w-3.5 h-3.5" /> Audit Logs
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

export default AdminLayout;
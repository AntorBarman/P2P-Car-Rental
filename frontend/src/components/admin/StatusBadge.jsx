import { CheckCircle, Clock, XCircle, AlertCircle, PauseCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const configs = {
    // General
    active: { variant: 'success', icon: CheckCircle, label: 'Active' },
    inactive: { variant: 'default', icon: PauseCircle, label: 'Inactive' },
    suspended: { variant: 'danger', icon: PauseCircle, label: 'Suspended' },
    
    // KYC/Documents
    pending: { variant: 'warning', icon: Clock, label: 'Pending' },
    approved: { variant: 'success', icon: CheckCircle, label: 'Approved' },
    rejected: { variant: 'danger', icon: XCircle, label: 'Rejected' },
    incomplete: { variant: 'warning', icon: AlertCircle, label: 'Incomplete' },
    
    // Bookings
    pending_payment: { variant: 'warning', icon: Clock, label: 'Pending Payment' },
    confirmed: { variant: 'success', icon: CheckCircle, label: 'Confirmed' },
    ongoing: { variant: 'primary', icon: Clock, label: 'Ongoing' },
    completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
    cancelled: { variant: 'danger', icon: XCircle, label: 'Cancelled' },
    expired: { variant: 'default', icon: Clock, label: 'Expired' },
    
    // Payments
    paid: { variant: 'success', icon: CheckCircle, label: 'Paid' },
    failed: { variant: 'danger', icon: XCircle, label: 'Failed' },
    refunded: { variant: 'warning', icon: AlertCircle, label: 'Refunded' },
    
    // Vehicles
    available: { variant: 'success', icon: CheckCircle, label: 'Available' },
    unavailable: { variant: 'danger', icon: XCircle, label: 'Unavailable' },
  };
  
  const config = configs[status] || { variant: 'default', icon: Clock, label: status };
  const Icon = config.icon;
  
  const variantClasses = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantClasses[config.variant]} ${sizeClasses[size]}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
import Badge from '../ui/Badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const VehicleStatusBadge = ({ status }) => {
  const statusConfig = {
    available: {
      variant: 'success',
      icon: CheckCircle,
      label: 'Available',
    },
    pending: {
      variant: 'warning',
      icon: Clock,
      label: 'Pending Approval',
    },
    approved: {
      variant: 'primary',
      icon: CheckCircle,
      label: 'Approved',
    },
    rejected: {
      variant: 'danger',
      icon: XCircle,
      label: 'Rejected',
    },
    unavailable: {
      variant: 'danger',
      icon: XCircle,
      label: 'Unavailable',
    },
    suspended: {
      variant: 'danger',
      icon: AlertCircle,
      label: 'Suspended',
    },
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} size="sm">
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export default VehicleStatusBadge;
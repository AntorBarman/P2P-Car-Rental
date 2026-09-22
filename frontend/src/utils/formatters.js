// Currency formatter
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '৳0';
  return `৳${Number(amount).toLocaleString('en-BD')}`;
};

// Date formatter
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Date range formatter
export const formatDateRange = (startDate, endDate) => {
  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
};

// Time formatter
export const formatTime = (timeString) => {
  if (!timeString) return '';
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Status color helper
export const getStatusColor = (status) => {
  const colors = {
    'pending_payment': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-green-100 text-green-800',
    'ongoing': 'bg-blue-100 text-blue-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800',
    'expired': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'available': 'bg-green-100 text-green-800',
    'unavailable': 'bg-red-100 text-red-800',
    'suspended': 'bg-orange-100 text-orange-800',
    'paid': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'initiated': 'bg-yellow-100 text-yellow-800',
    'credit': 'bg-green-100 text-green-800',
    'debit': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Status label formatter
export const formatStatus = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// Calculate days between dates
export const calculateDays = (pickupDate, returnDate) => {
  if (!pickupDate || !returnDate) return 0;
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  if (phone.startsWith('01') && phone.length === 11) {
    return `+880 ${phone.slice(0, 4)}-${phone.slice(4)}`;
  }
  return phone;
};

// Format percentage
export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(0)}%`;
};

// Format large numbers
export const formatNumber = (number) => {
  return Number(number).toLocaleString('en-BD');
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
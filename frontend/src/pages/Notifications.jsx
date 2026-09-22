import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, Trash2, CheckCheck, MailOpen } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { toast } from 'react-toastify';

const Notifications = () => {
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const limit = 20;

  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [accessToken, page, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/notifications/my?limit=${limit}&offset=${(page - 1) * limit}`);
      const data = response.data.data;
      
      let filtered = data.notifications || [];
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.is_read);
      }
      
      setNotifications(filtered);
      setTotal(filter === 'unread' ? data.unread : data.total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'BOOKING_CREATED': '📝',
      'BOOKING_CONFIRMED': '✅',
      'PAYMENT_SUCCESS': '💳',
      'PAYMENT_FAILED': '⚠️',
      'BOOKING_CANCELLED': '❌',
      'REFUND_PROCESSED': '🔄',
      'OWNER_NEW_BOOKING': '🚗',
      'OWNER_PAYMENT_RECEIVED': '💰',
      'ADMIN_NEW_BOOKING': '📊',
      'ADMIN_KYC_REVIEW': '📋',
      'ADMIN_DOCUMENT_REVIEW': '📄',
      'KYC_APPROVED': '✅',
      'KYC_REJECTED': '❌',
      'VEHICLE_DOCUMENT_SUBMITTED': '📄',
      'VEHICLE_DOCUMENT_APPROVED': '✅',
      'VEHICLE_DOCUMENT_REJECTED': '❌',
      'BOOKING_EXPIRING': '⏰',
      'BOOKING_EXPIRED': '⏰',
    };
    return icons[type] || '📢';
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor((now - date) / 3600000);
    const diffDays = Math.floor((now - date) / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && page === 1) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">
              {total} notifications • {unreadCount} unread
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === 'unread' ? 'primary' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900">No notifications</h3>
          <p className="text-slate-500">
            {filter === 'unread' ? "You don't have any unread notifications" : "You're all caught up!"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-l-4 rounded-lg p-4 transition-colors ${
                !notification.is_read ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <MailOpen className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(prev => prev - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600 flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
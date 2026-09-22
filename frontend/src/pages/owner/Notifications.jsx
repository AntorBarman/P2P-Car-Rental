import { Bell, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/admin/PageHeader';

const OwnerNotifications = () => {
  const notifications = [
    { id: 1, title: 'New booking received', desc: 'BMW 3 Series booked by Tatas', time: '5 min ago', read: false },
    { id: 2, title: 'Payment received', desc: '৳37,000 from booking #BK-001', time: '2 hours ago', read: false },
    { id: 3, title: 'Vehicle document approved', desc: 'Mercedes C200 registration verified', time: 'Yesterday', read: true },
  ];
  
  return (
    <div>
      <PageHeader title="Notifications" description="Stay updated with your fleet activity" />
      
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`p-3 flex items-start gap-3 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <Bell className={`w-4 h-4 ${!notification.read ? 'text-white' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="text-xs text-slate-500">{notification.desc}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{notification.time}</p>
            </div>
            {!notification.read && (
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OwnerNotifications;
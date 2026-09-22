import { Inbox, Search, CalendarX, Car } from 'lucide-react';

const EmptyState = ({
  title = 'Nothing here yet',
  description = 'There are no items to display at the moment.',
  icon: Icon = Inbox,
  action = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-md mb-6">{description}</p>
      
      {action}
    </div>
  );
};

export default EmptyState;
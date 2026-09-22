import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ customItems = [] }) => {
  const location = useLocation();
  
  const getBreadcrumbItems = () => {
    if (customItems.length > 0) return customItems;
    
    const segments = location.pathname.split('/').filter(Boolean);
    
    return segments.map((segment, index) => {
      const url = '/' + segments.slice(0, index + 1).join('/');
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      
      return { url, label, isLast: index === segments.length - 1 };
    });
  };
  
  const items = getBreadcrumbItems();
  
  if (items.length === 0) return null;
  
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <span key={item.url || index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.isLast ? (
            <span className="text-slate-900 font-medium">{item.label}</span>
          ) : (
            <Link to={item.url} className="hover:text-blue-600 transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
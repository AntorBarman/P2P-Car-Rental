import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, description, breadcrumbs = [], actions = null }) => {
  return (
    <div className="mb-5">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <Link to="/admin" className="hover:text-blue-600 flex items-center gap-1">
            <Home className="w-3 h-3" /> Admin
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600 font-medium">{crumb}</span>
            </span>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
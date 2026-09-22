import { TrendingUp, TrendingDown } from 'lucide-react';

const KpiCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change = null,
  color = 'blue',
  onClick = null,
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg p-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {change !== null && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default KpiCard;
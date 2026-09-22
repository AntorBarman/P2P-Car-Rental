import { TrendingUp, TrendingDown, Wallet, Car, Star, Clock } from 'lucide-react';

const RevenueCard = ({ 
  title, 
  value, 
  subtitle, 
  change = null,
  icon: Icon = Wallet,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {change !== null && (
          <span className={`flex items-center gap-1 text-xs font-medium ${
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
      
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export default RevenueCard;
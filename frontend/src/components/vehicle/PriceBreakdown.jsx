import { formatCurrency } from '../../utils/formatters';

const PriceBreakdown = ({ dailyRate, depositAmount, days, rentalAmount, totalAmount }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">
          {formatCurrency(dailyRate)} × {days} days
        </span>
        <span className="text-slate-900 font-medium">{formatCurrency(rentalAmount)}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Security Deposit (Refundable)</span>
        <span className="text-slate-900 font-medium">{formatCurrency(depositAmount)}</span>
      </div>
      
      <div className="border-t border-slate-200 pt-3 flex justify-between">
        <span className="text-slate-900 font-semibold">Total</span>
        <span className="text-slate-900 font-bold text-lg">{formatCurrency(totalAmount)}</span>
      </div>
      
      <p className="text-xs text-slate-400">
        Security deposit will be refunded after the trip is completed.
      </p>
    </div>
  );
};

export default PriceBreakdown;
import { formatCurrency } from '../../utils/formatters';

const PriceBreakdown = ({
  dailyRate,
  days,
  rentalAmount,
  depositAmount,
  totalAmount,
}) => {
  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-slate-900">Price Breakdown</h3>
      
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
      
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Service Fee</span>
        <span className="text-slate-900 font-medium">৳0</span>
      </div>
      
      <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
        <span className="text-slate-900 font-semibold">Total</span>
        <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
      </div>
      
      <p className="text-xs text-slate-400">
        Security deposit will be refunded within 48 hours after trip completion.
      </p>
    </div>
  );
};

export default PriceBreakdown;
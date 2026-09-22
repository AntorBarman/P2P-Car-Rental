import { Calendar } from 'lucide-react';

const DateSelector = ({ pickupDate, returnDate, onPickupChange, onReturnChange, error }) => {
  // Get tomorrow's date
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Get min return date (day after pickup)
  const getMinReturnDate = () => {
    if (!pickupDate) return getTomorrow();
    const nextDay = new Date(pickupDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };
  
  const minDate = getTomorrow();
  const minReturnDate = getMinReturnDate();
  
  console.log('🔍 DateSelector:', { minDate, minReturnDate, pickupDate, returnDate });
  
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Pickup Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              min={minDate}
              value={pickupDate}
              onChange={(e) => {
                console.log('🔍 Pickup date selected:', e.target.value);
                onPickupChange(e.target.value);
                // Reset return date if invalid
                if (returnDate && returnDate <= e.target.value) {
                  onReturnChange('');
                }
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Return Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              min={minReturnDate}
              value={returnDate}
              onChange={(e) => {
                console.log('🔍 Return date selected:', e.target.value);
                onReturnChange(e.target.value);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-slate-400 mt-1">
        * Pickup must be at least 1 day in advance
      </p>
    </div>
  );
};

export default DateSelector;
import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon = null,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || props.name;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-900 mb-1.5">
          {label}
          {props.required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 
            transition-all duration-200
            focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}
            ${className}`}
          {...props}
        />
      </div>
      
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading data.',
  onRetry = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 bg-danger-light rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-danger" />
      </div>
      
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <Button variant="outline" onClick={onRetry} icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
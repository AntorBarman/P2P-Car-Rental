import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ 
  label = 'Back', 
  to = null,
  className = '',
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors ${className}`}
      type="button"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};

export default BackButton;
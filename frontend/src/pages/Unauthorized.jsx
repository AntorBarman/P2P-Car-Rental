import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          Access Denied
        </h2>
        <p className="text-slate-500 mb-8">
          You don't have permission to access this page. Please contact support if you think this is a mistake.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
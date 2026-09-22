import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Shield, Lock, CreditCard, CheckCircle } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  const trustItems = [
    { icon: Shield, text: 'Verified Vehicles & Owners' },
    { icon: Lock, text: 'Secure KYC Process' },
    { icon: CreditCard, text: 'SSLCommerz Payments' },
    { icon: CheckCircle, text: '24/7 Support' },
  ];
  
  return (
    <div className="min-h-screen flex">
      {/* ============ LEFT: FORM ============ */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-12 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto w-full"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              UDrive<span className="text-blue-600">BD</span>
            </span>
          </Link>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </h1>
          <p className="text-slate-500 mb-8">{subtitle}</p>
          
          {/* Content */}
          {children}
        </motion.div>
      </div>
      
      {/* ============ RIGHT: BRANDING PANEL ============ */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white p-12 flex-col justify-between">
        {/* SVG Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <circle cx="15" cy="20" r="12" fill="white" />
          <circle cx="80" cy="15" r="18" fill="white" />
          <circle cx="25" cy="70" r="15" fill="white" />
          <circle cx="90" cy="75" r="10" fill="white" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="0.3" />
          <path d="M0 60 Q 25 40 50 60 T 100 60" fill="none" stroke="white" strokeWidth="0.3" />
          <path d="M0 75 Q 25 55 50 75 T 100 75" fill="none" stroke="white" strokeWidth="0.2" />
        </svg>
        
        {/* Content */}
        <div className="relative">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Drive Your Way<br />Across Bangladesh
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-blue-200 text-lg"
          >
            Join thousands of satisfied customers and trusted owners.
          </motion.p>
        </div>
        
        {/* Trust Badges */}
        <div className="relative space-y-4">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-blue-100 text-sm">{item.text}</span>
              </motion.div>
            );
          })}
        </div>
        
        <p className="relative text-blue-300 text-sm">© 2026 UDrive Bangladesh</p>
      </div>
    </div>
  );
};

export default AuthLayout;
import { Link } from 'react-router-dom';
import { 
  Car,
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  CreditCard,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                UDrive<span className="text-blue-400">BD</span>
              </span>
            </Link>
            
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
              Bangladesh's trusted peer-to-peer self-drive car rental platform.
            </p>
            
            {/* ✅ Real Social Icons */}
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                <FaWhatsapp className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                <FaLinkedinIn className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/vehicles" className="text-slate-400 hover:text-white text-sm transition-colors">Browse Cars</Link></li>
              <li><Link to="/how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How It Works</Link></li>
              <li><Link to="/branches" className="text-slate-400 hover:text-white text-sm transition-colors">Branches</Link></li>
              <li><Link to="/become-owner" className="text-slate-400 hover:text-white text-sm transition-colors">Become Owner</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:+8801712345678" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4" /> +880 1712-345678
                </a>
              </li>
              <li>
                <a href="mailto:support@udrivebd.com" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4" /> support@udrivebd.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5" /> Banani, Dhaka, Bangladesh
              </li>
            </ul>
          </div>
          
          {/* Trust */}
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase">Trust</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Shield className="w-4 h-4 text-green-400" /> Verified Vehicles
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock className="w-4 h-4 text-green-400" /> Secure KYC
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <CreditCard className="w-4 h-4 text-green-400" /> SSLCommerz Payments
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between gap-2">
          <p className="text-slate-500 text-sm">© 2026 UDrive Bangladesh. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-slate-500 hover:text-white text-xs">Privacy</Link>
            <Link to="/terms" className="text-slate-500 hover:text-white text-xs">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
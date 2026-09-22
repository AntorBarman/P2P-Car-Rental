import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Car, 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  Clock,
  Wallet,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 },
};

const BecomeOwner = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Turn Your Car Into <span className="text-green-400">Income</span>
          </h1>
          <p className="text-lg text-slate-300 mb-6 max-w-2xl mx-auto">
            List your vehicle on UDrive, get verified, and start earning from your car.
          </p>
          <Link to="/register?role=owner">
            <Button size="lg" variant="secondary" className="btn-hover">
              <Car className="w-5 h-5" />
              Start Earning Today
            </Button>
          </Link>
        </div>
      </section>
      
      {/* How It Works */}
      <motion.section {...fadeInUp} className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          How Owner Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Car, title: 'List Your Car', desc: 'Add vehicle details and photos' },
            { icon: Shield, title: 'Get Verified', desc: 'KYC + vehicle document verification' },
            { icon: Calendar, title: 'Receive Bookings', desc: 'Customers book your vehicle' },
            { icon: Wallet, title: 'Earn Securely', desc: '85% of booking amount goes to you' },
          ].map((item, index) => (
            <div key={item.title} className="text-center p-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-white shadow-lg bg-gradient-to-br ${
                index % 2 === 0 ? 'from-green-500 to-green-700' : 'from-blue-500 to-blue-700'
              }`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>
      
      {/* Benefits */}
      <motion.section {...fadeInUp} className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Why List on UDrive?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Earn Up to 85%', desc: 'Keep 85% of every booking amount' },
              { icon: Shield, title: 'Secure Platform', desc: 'Verified customers with KYC' },
              { icon: Clock, title: 'Flexible Control', desc: 'Set your own pricing and availability' },
            ].map((item) => (
              <Card key={item.title} className="card-hover text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>
      
      {/* Requirements */}
      <motion.section {...fadeInUp} className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Requirements
        </h2>
        
        <Card className="p-6">
          <ul className="space-y-3">
            {[
              'Valid NID (National ID Card)',
              'Driving License',
              'Vehicle Registration Certificate (RC)',
              'Vehicle Insurance',
              'Vehicle Photos (Front, Back, Left, Right)',
              'Active Bank / bKash / Nagad account',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        
        <div className="text-center mt-8">
          <Link to="/register?role=owner">
            <Button size="lg" className="btn-hover">
              <Car className="w-5 h-5" />
              Become an Owner
            </Button>
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default BecomeOwner;
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Car, Calendar, Shield, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';

const HowItWorks = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        How UDrive Works
      </h1>
      
      <div className="space-y-8">
        {[
          { step: 1, icon: Search, title: 'Search Cars', desc: 'Browse verified vehicles by location, date, and price.' },
          { step: 2, icon: Car, title: 'Choose Vehicle', desc: 'Compare specifications, pricing, and availability.' },
          { step: 3, icon: Calendar, title: 'Book & Pay', desc: 'Select dates and pay securely with SSLCommerz.' },
          { step: 4, icon: Shield, title: 'Drive Safely', desc: 'Pick up your verified car and enjoy your trip.' },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-5">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {item.step}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-10">
        <Link to="/vehicles">
          <Button size="lg" className="btn-hover">
            Browse Cars <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks;
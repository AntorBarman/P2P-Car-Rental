// frontend/src/pages/public/Home.jsx (COMPLETE - Only Reviews Section Updated)

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Shield, 
  Key, 
  Lock, 
  CreditCard,
  Car,
  ChevronRight,
  Star,
  CheckCircle,
  Clock,
  ArrowRight,
  Quote,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import reviewService from '../../services/reviewService';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatters';

// ✅ Animation helper
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const Home = () => {
  const navigate = useNavigate();
  
  const [searchData, setSearchData] = useState({
    location: '',
    pickupDate: '',
    returnDate: '',
  });
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  useEffect(() => {
    fetchHomeData();
    fetchRecentReviews();
  }, []);
  
  const fetchHomeData = async () => {
    try {
      const vehiclesRes = await api.get('/vehicles?limit=6');
      setFeaturedVehicles(vehiclesRes.data?.data || vehiclesRes.data || []);
      
      const branchesRes = await api.get('/branches');
      setBranches(branchesRes.data?.data || branchesRes.data || []);
    } catch (error) {
      setFeaturedVehicles([]);
      setBranches([]);
    }
  };
  
  // ✅ Fetch dynamic reviews
  const fetchRecentReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await reviewService.getRecentReviews(3);
      setRecentReviews(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setRecentReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchData.location) params.append('location', searchData.location);
    navigate(`/vehicles?${params.toString()}`);
  };
  
  return (
    <div>
      {/* ============ HERO SECTION ============ */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 border-4 border-blue-500 rounded-full" />
          <div className="absolute bottom-20 right-10 w-64 h-64 border-4 border-blue-400 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-blue-300 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Drive Your Way{' '}
              <span className="text-blue-400">Across Bangladesh</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-4">
              Verified cars. Trusted owners. Your journey, your way.
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Verified Cars</span>
              <span className="flex items-center gap-1"><Lock className="w-4 h-4 text-green-400" /> Secure Payment</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-400" /> KYC Protected</span>
            </div>
          </motion.div>
          
          {/* Search Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <form onSubmit={handleSearch}>
              <div className="bg-white rounded-xl shadow-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={searchData.location}
                      onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Pickup Location</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.city}>{branch.city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={searchData.pickupDate}
                      onChange={(e) => setSearchData({ ...searchData, pickupDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={searchData.returnDate}
                      onChange={(e) => setSearchData({ ...searchData, returnDate: e.target.value })}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn-hover bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-3 px-6 flex items-center justify-center gap-2 transition-all"
                  >
                    <Search className="w-5 h-5" />
                    Search Cars
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
      
      {/* ============ POPULAR CARS ============ */}
      <motion.section {...fadeInUp} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Popular Cars Near You
            </h2>
            <p className="text-slate-500 text-sm">Verified vehicles ready for your next trip</p>
          </div>
          <Link to="/vehicles" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {featuredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredVehicles.slice(0, 6).map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="card-hover bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  {vehicle.primary_image ? (
                    <img
                      src={vehicle.primary_image}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-xs font-medium">
                    {vehicle.vehicle_type}
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      {Number(vehicle.average_rating || 0).toFixed(1)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 mb-2">
                    {vehicle.year} • {vehicle.branch_name || 'Available'}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">
                      {formatCurrency(vehicle.daily_rate)}<span className="text-xs text-slate-400">/day</span>
                    </span>
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      View Car <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No vehicles available yet</p>
          </Card>
        )}
      </motion.section>
      
      {/* ============ WHY CHOOSE UDRIVE ============ */}
      <motion.section {...fadeInUp} className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Why Choose UDrive?
            </h2>
            <p className="text-slate-500">Built on trust, safety, and convenience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Shield, title: 'Verified Vehicles', desc: 'Every vehicle reviewed and verified before rental' },
              { icon: Key, title: 'Secure KYC', desc: 'Identity verification for owners and renters' },
              { icon: CreditCard, title: 'Secure Payments', desc: 'SSLCommerz protected transactions' },
              { icon: Clock, title: 'Flexible Pickup', desc: 'Multiple locations across Bangladesh' },
              { icon: CheckCircle, title: 'Trusted Owners', desc: 'Community of verified car owners' },
            ].map((item, index) => (
              <div key={item.title} className={`card-hover text-center p-4 rounded-xl ${
                index % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md ${
                  index % 3 === 0 ? 'bg-blue-600' : index % 3 === 1 ? 'bg-blue-700' : 'bg-blue-500'
                }`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
      
      {/* ============ HOW IT WORKS ============ */}
      <motion.section {...fadeInUp} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            How It Works
          </h2>
          <p className="text-slate-500">Four simple steps to your next journey</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Search', desc: 'Find the perfect car for your needs' },
            { step: '2', title: 'Choose', desc: 'Select dates and review pricing' },
            { step: '3', title: 'Book', desc: 'Pay securely with SSLCommerz' },
            { step: '4', title: 'Drive', desc: 'Pick up your car and go!' },
          ].map((item) => (
            <div key={item.step} className="text-center relative">
              <div className="w-14 h-14 text-white text-xl font-bold rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg bg-gradient-to-br from-blue-500 to-blue-700">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
              
              {item.step !== '4' && (
                <ArrowRight className="hidden md:block absolute top-6 -right-4 w-6 h-6 text-slate-300" />
              )}
            </div>
          ))}
        </div>
      </motion.section>
      
      {/* ============ BRANCHES ============ */}
      <motion.section {...fadeInUp} className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Pickup Locations
              </h2>
              <p className="text-slate-500 text-sm">Find a UDrive location near you</p>
            </div>
            <Link to="/branches" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {branches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {branches.slice(0, 3).map((branch) => (
                <div key={branch.id} className="card-hover bg-slate-50 rounded-xl p-4">
                  <MapPin className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="font-semibold text-slate-900">{branch.name}</p>
                  <p className="text-xs text-slate-500">{branch.address}</p>
                  <p className="text-xs text-slate-400 mt-1">{branch.city}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card className="py-8 text-center">
              <p className="text-slate-500">Locations coming soon</p>
            </Card>
          )}
        </div>
      </motion.section>
      
      {/* ============ BECOME OWNER CTA ============ */}
      <motion.section {...fadeInUp} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Turn Your Car Into an Income Source
          </h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            List your vehicle on UDrive, get verified, and start earning from your car.
          </p>
          <Link to="/become-owner">
            <Button variant="secondary" size="lg" className="btn-hover">
              Become a UDrive Owner
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </motion.section>
      
      {/* ============ TESTIMONIALS (DYNAMIC) ============ */}
      <motion.section {...fadeInUp} className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              What Our Customers Say
            </h2>
            <p className="text-slate-500">Real experiences from verified renters</p>
          </div>
          
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : recentReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="card-hover bg-white border border-slate-200 rounded-xl p-6">
                  <Quote className="w-8 h-8 text-blue-200 mb-3" />
                  
                  <div className="flex mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < review.rating 
                            ? 'fill-yellow-500 text-yellow-500' 
                            : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    "{review.comment}"
                  </p>
                  
                  {review.brand && (
                    <p className="text-xs text-blue-600 font-medium mb-3">
                      {review.brand} {review.model} {review.year}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {review.customer_avatar ? (
                        <img
                          src={review.customer_avatar}
                          alt={review.customer_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-sm">
                          {review.customer_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {review.customer_name}
                      </p>
                      <p className="text-[10px] text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified Customer
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="py-12 text-center">
              <Quote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No reviews yet. Be the first to review!</p>
              <Link to="/vehicles" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                Browse Cars
              </Link>
            </Card>
          )}
        </div>
      </motion.section>
      
      {/* ============ FAQ ============ */}
      <motion.section {...fadeInUp} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500">Common questions about renting with UDrive</p>
        </div>
        
        <div className="space-y-3">
          {[
            { q: 'Do I need a driving license?', a: 'Yes. A valid driving license is required for self-drive rentals.' },
            { q: 'Is a security deposit required?', a: 'Yes, depending on the vehicle and booking details.' },
            { q: 'Can I cancel my booking?', a: 'Cancellation depends on the booking\'s cancellation policy.' },
            { q: 'Are the vehicles verified?', a: 'Yes, vehicles go through document and inspection verification.' },
          ].map((faq) => (
            <div key={faq.q} className="card-hover bg-white border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-sm text-slate-900 mb-1">{faq.q}</p>
              <p className="text-xs text-slate-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.section>
      
      {/* ============ FINAL CTA ============ */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ready to Hit the Road?
          </h2>
          <p className="text-slate-300 mb-6">
            Find a verified self-drive car for your next journey.
          </p>
          <Link to="/vehicles">
            <Button size="lg" className="btn-hover">
              <Car className="w-5 h-5" />
              Browse Cars
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
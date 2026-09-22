import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft,
  Car,
  Edit,
  Calendar,
  Wallet,
  TrendingUp,
  Star,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import StatusBadge from '../../components/admin/StatusBadge';
import vehicleService from '../../services/vehicleService';
import bookingService from '../../services/bookingService';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OwnerVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (accessToken && id) fetchVehicleData();
  }, [accessToken, id]);
  
  const fetchVehicleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const vehicleRes = await vehicleService.getById(id);
      setVehicle(vehicleRes.data || vehicleRes);
      
      const bookingsRes = await bookingService.getOwnerBookings();
      setBookings((bookingsRes.data || []).filter((b) => b.vehicle_id === id));
      
      const docsRes = await api.get('/documents/my');
      setDocuments((docsRes.data.data || []).filter((d) => d.vehicle_id === id));
    } catch (error) {
      setError('Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <ErrorState title="Failed" message={error} onRetry={fetchVehicleData} />;
  if (!vehicle) return <div className="text-center py-16">Vehicle not found</div>;
  
  const totalRevenue = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  
  const utilization = vehicle.total_bookings > 0
    ? Math.min(Math.round((vehicle.total_bookings / 30) * 100), 100)
    : 0;
  
  const getDocStatus = (type) => {
    const doc = documents.find((d) => d.document_type === type);
    return doc ? doc.status : 'missing';
  };
  
  return (
    <div>
      <button onClick={() => navigate('/owner/vehicles')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-3">
        <ChevronLeft className="w-4 h-4" /> Back to My Vehicles
      </button>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">
            {vehicle.brand === vehicle.model ? vehicle.brand : `${vehicle.brand} ${vehicle.model}`}
          </h1>
          <StatusBadge status={vehicle.status} size="sm" />
        </div>
        <Link to={`/owner/vehicles/${id}/edit`}>
          <Button size="sm" variant="outline">
            <Edit className="w-4 h-4" /> Edit Vehicle
          </Button>
        </Link>
      </div>
      
      {/* Main Image */}
      {vehicle.primary_image && (
        <img src={vehicle.primary_image} alt="" className="w-full h-64 object-cover rounded-lg mb-4" crossOrigin="anonymous" />
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="p-3 text-center">
          <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Bookings</p>
          <p className="text-lg font-bold">{vehicle.total_bookings || 0}</p>
        </Card>
        <Card className="p-3 text-center">
          <Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Revenue</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Utilization</p>
          <p className="text-lg font-bold text-purple-700">{utilization}%</p>
        </Card>
        <Card className="p-3 text-center">
          <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 uppercase">Rating</p>
          <p className="text-lg font-bold">{Number(vehicle.average_rating || 0).toFixed(1)}</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Basic Info */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Vehicle Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Year:</span> {vehicle.year}</div>
            <div><span className="text-slate-500">Type:</span> <span className="capitalize">{vehicle.vehicle_type}</span></div>
            <div><span className="text-slate-500">Transmission:</span> <span className="capitalize">{vehicle.transmission}</span></div>
            <div><span className="text-slate-500">Fuel:</span> <span className="capitalize">{vehicle.fuel_type}</span></div>
            <div><span className="text-slate-500">Seats:</span> {vehicle.seats}</div>
            <div><span className="text-slate-500">Color:</span> {vehicle.color || 'N/A'}</div>
          </div>
        </Card>
        
        {/* Pricing */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Pricing</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Daily Rate</span>
              <span className="font-medium">{formatCurrency(vehicle.daily_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security Deposit</span>
              <span className="font-medium">{formatCurrency(vehicle.deposit_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch</span>
              <span className="font-medium">{vehicle.branch_name || 'N/A'}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Documents */}
      <Card className="mt-3">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Documents
        </h3>
        <div className="space-y-2">
          {[
            { type: 'vehicle_rc', label: 'Registration Certificate' },
            { type: 'insurance', label: 'Insurance' },
            { type: 'tax_token', label: 'Tax Token' },
          ].map((doc) => {
            const status = getDocStatus(doc.type);
            return (
              <div key={doc.type} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-sm">{doc.label}</span>
                {status === 'approved' ? (
                  <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                ) : status === 'pending' ? (
                  <Badge variant="warning" size="sm"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
                ) : status === 'rejected' ? (
                  <Badge variant="danger" size="sm"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
                ) : (
                  <Badge variant="default" size="sm">Missing</Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Booking History */}
      <Card className="mt-3 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold">Booking History</h3>
        </div>
        {bookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 10).map((booking) => (
              <div key={booking.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}</p>
                </div>
                <span className="text-sm font-medium">{formatCurrency(booking.total_amount)}</span>
                <StatusBadge status={booking.status} size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No bookings yet</p>
        )}
      </Card>
    </div>
  );
};

export default OwnerVehicleDetails;
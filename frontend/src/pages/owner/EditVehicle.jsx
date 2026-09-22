import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import vehicleService from '../../services/vehicleService';

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchVehicle();
  }, [id]);
  
  const fetchVehicle = async () => {
    try {
      const response = await vehicleService.getById(id);
      const vehicle = response.data;
      
      setFormData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        vehicle_type: vehicle.vehicle_type || 'sedan',
        transmission: vehicle.transmission || 'automatic',
        fuel_type: vehicle.fuel_type || 'petrol',
        seats: vehicle.seats || 5,
        color: vehicle.color || '',
        daily_rate: Number(vehicle.daily_rate) || '',
        deposit_amount: Number(vehicle.deposit_amount) || '',
        description: vehicle.description || '',
      });
    } catch (error) {
      setError('Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await vehicleService.updateVehicle(id, formData);
      setSuccess('Vehicle updated successfully!');
      setTimeout(() => navigate('/owner/vehicles'), 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!formData) {
    return <div className="text-center py-20">Vehicle not found</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/owner/vehicles')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Edit Vehicle</h1>
      <p className="text-slate-500 mb-6">Update your vehicle information</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 mb-4">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 mb-4">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
            <Input label="Model" name="model" value={formData.model} onChange={handleChange} />
            <Input label="Year" name="year" type="number" value={formData.year} onChange={handleChange} />
            <Input label="Color" name="color" value={formData.color} onChange={handleChange} />
          </div>
        </Card>
        
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Daily Rate (৳)"
              name="daily_rate"
              type="number"
              value={formData.daily_rate}
              onChange={handleChange}
            />
            <Input
              label="Deposit Amount (৳)"
              name="deposit_amount"
              type="number"
              value={formData.deposit_amount}
              onChange={handleChange}
            />
          </div>
        </Card>
        
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Description</h2>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
        </Card>
        
        <Button type="submit" fullWidth size="lg" isLoading={saving}>
          {saving ? 'Saving...' : 'Update Vehicle'}
        </Button>
      </form>
    </div>
  );
};

export default EditVehicle;
import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Calendar, 
  CreditCard, 
  Shield,
  Car, 
  Bell, 
  MapPin,
  Lock,
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

const AdminSettings = () => {
  const { accessToken } = useSelector((state) => state.auth);
  
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSection, setActiveSection] = useState('general');
  
  const fetchSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data.data || response.data || defaultSettings);
    } catch (error) {
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      await api.patch('/admin/settings', settings);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  const defaultSettings = {
    // General
    platform_name: 'UDrive Bangladesh',
    support_email: 'support@udrivebd.com',
    support_phone: '+8801700000000',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    
    // Booking
    min_rental_days: 1,
    max_rental_days: 30,
    advance_booking_days: 90,
    auto_confirm_booking: true,
    
    // Payment
    commission_rate: 15,
    security_deposit_min: 5000,
    payout_schedule: 'weekly',
    
    // KYC
    customer_kyc_required: true,
    owner_kyc_required: true,
    vehicle_documents_required: true,
    
    // System
    maintenance_mode: false,
    audit_logging: true,
  };
  
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  
  const sections = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'booking', label: 'Booking', icon: Calendar },
    { id: 'payment', label: 'Payment & Finance', icon: CreditCard },
    { id: 'kyc', label: 'KYC & Verification', icon: Shield },
    { id: 'vehicle', label: 'Vehicles', icon: Car },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ];
  
  return (
    <div>
      <PageHeader title="Settings" description="System-wide configuration" />
      
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Settings Navigation */}
        <Card className="p-2">
          <div className="space-y-0.5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </Card>
        
        {/* Settings Content */}
        <Card className="lg:col-span-3 p-4">
          {/* ============ GENERAL ============ */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Platform Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Platform Name"
                  value={settings?.platform_name || ''}
                  onChange={(e) => updateSetting('platform_name', e.target.value)}
                />
                <Input
                  label="Support Email"
                  type="email"
                  value={settings?.support_email || ''}
                  onChange={(e) => updateSetting('support_email', e.target.value)}
                />
                <Input
                  label="Support Phone"
                  value={settings?.support_phone || ''}
                  onChange={(e) => updateSetting('support_phone', e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Timezone</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={settings?.timezone || 'Asia/Dhaka'}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Currency</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={settings?.currency || 'BDT'}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* ============ BOOKING ============ */}
          {activeSection === 'booking' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Booking Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Minimum Rental Days"
                  type="number"
                  min="1"
                  value={settings?.min_rental_days || 1}
                  onChange={(e) => updateSetting('min_rental_days', Number(e.target.value))}
                />
                <Input
                  label="Maximum Rental Days"
                  type="number"
                  min="1"
                  value={settings?.max_rental_days || 30}
                  onChange={(e) => updateSetting('max_rental_days', Number(e.target.value))}
                />
                <Input
                  label="Advance Booking Limit (Days)"
                  type="number"
                  min="1"
                  value={settings?.advance_booking_days || 90}
                  onChange={(e) => updateSetting('advance_booking_days', Number(e.target.value))}
                />
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={settings?.auto_confirm_booking || false}
                    onChange={(e) => updateSetting('auto_confirm_booking', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Auto-confirm bookings after payment</span>
                </div>
              </div>
            </div>
          )}
          
          {/* ============ PAYMENT ============ */}
          {activeSection === 'payment' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Payment & Finance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Platform Commission Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={settings?.commission_rate || 15}
                  onChange={(e) => updateSetting('commission_rate', Number(e.target.value))}
                />
                <Input
                  label="Minimum Security Deposit (৳)"
                  type="number"
                  min="0"
                  value={settings?.security_deposit_min || 5000}
                  onChange={(e) => updateSetting('security_deposit_min', Number(e.target.value))}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Payout Schedule</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                    value={settings?.payout_schedule || 'weekly'}
                    onChange={(e) => updateSetting('payout_schedule', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* ============ KYC ============ */}
          {activeSection === 'kyc' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">KYC & Verification</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings?.customer_kyc_required || false}
                    onChange={(e) => updateSetting('customer_kyc_required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Customer KYC required for booking</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings?.owner_kyc_required || false}
                    onChange={(e) => updateSetting('owner_kyc_required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Owner KYC required for vehicle listing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings?.vehicle_documents_required || false}
                    onChange={(e) => updateSetting('vehicle_documents_required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Vehicle documents required for approval</span>
                </label>
              </div>
            </div>
          )}
          
          {/* ============ VEHICLES ============ */}
          {activeSection === 'vehicle' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Vehicle Settings</h3>
              <p className="text-xs text-slate-500">
                Vehicle categories, required documents, and approval rules are managed here.
              </p>
            </div>
          )}
          
          {/* ============ NOTIFICATIONS ============ */}
          {activeSection === 'notification' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Notification Settings</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm">Email notifications</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm">In-app notifications</span>
                </label>
              </div>
            </div>
          )}
          
          {/* ============ SECURITY ============ */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Security & Access</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings?.maintenance_mode || false}
                    onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Maintenance Mode</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings?.audit_logging || false}
                    onChange={(e) => updateSetting('audit_logging', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Audit Logging</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Save Button */}
          <div className="mt-5 border-t border-slate-200 pt-4">
            <Button onClick={handleSave} isLoading={saving}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
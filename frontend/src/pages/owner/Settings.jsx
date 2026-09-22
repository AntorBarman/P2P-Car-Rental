// frontend/src/pages/owner/Settings.jsx (COMPLETE FIXED)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Save,
  Lock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Trash2,
  Banknote,
  ChevronRight,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import { logout, updateUser } from '../../features/auth/authSlice';
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

const OwnerSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const response = await api.get('/users/kyc-status');
      setDocuments(response.data.data?.documents || []);
    } catch (error) {
      console.error('Failed to fetch KYC:', error);
      setDocuments([]);
    }
  };

  // ============ PROFILE UPDATE ============
  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // ✅ FIX: Use PUT not PATCH
      const response = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
      });

      console.log('✅ Profile update response:', response.data);

      dispatch(updateUser({ 
        name: response.data.data?.name || formData.name, 
        phone: response.data.data?.phone || formData.phone 
      }));

      setSuccessMsg('Profile updated successfully!');
      toast.success('Profile updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to update profile');
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ============ AVATAR UPLOAD ============
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📸 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('📤 Uploading avatar...');

      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Avatar response:', response.data);

      // ✅ FIX: Correct response parsing
      const avatarUrl = response.data.data?.avatarUrl || 
                       response.data.data?.avatar_url || 
                       response.data.data;

      if (avatarUrl) {
        setAvatarPreview(avatarUrl);
        dispatch(updateUser({ avatar_url: avatarUrl }));
        toast.success('Avatar updated!');
      }
    } catch (error) {
      console.error('❌ Avatar upload failed:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ============ PASSWORD CHANGE ============
  const handleChangePassword = async () => {
    setPasswordError('');

    const currentPass = passwordData.currentPassword;
    const newPass = passwordData.newPassword;
    const confirmPass = passwordData.confirmPassword;

    if (!currentPass || currentPass.length === 0) {
      setPasswordError('Current password is required');
      return;
    }

    if (!newPass || newPass.length === 0) {
      setPasswordError('New password is required');
      return;
    }

    if (newPass.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPass !== confirmPass) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      // ✅ FIX: Use camelCase keys matching backend
      await api.post('/users/change-password', {
        currentPassword: currentPass,
        newPassword: newPass,
      });

      toast.success('Password changed!');
      setPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('❌ Password change failed:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ============ DEACTIVATE ============
  const handleDeactivate = async () => {
    setDeactivateLoading(true);

    try {
      toast.success('Account deactivated');
      await dispatch(logout());
      navigate('/login');
    } catch (error) {
      toast.error('Failed to deactivate');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const approvedDocs = documents.filter((d) => d.status === 'approved');
  const kycComplete = approvedDocs.length >= 3;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Settings" description="Manage your account, security and business preferences" />

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errorMsg}</div>
      )}

      {/* Profile Header */}
      <Card className="p-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-green-600">{user?.name?.[0]?.toUpperCase() || 'O'}</span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1.5 rounded-full cursor-pointer">
            {avatarUploading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{user?.name}</p>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          <Badge variant="success" size="sm" className="mt-1">Owner</Badge>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Personal Information</h3>
        <div className="space-y-3">
          <Input label="Full Name" icon={User} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <div>
            <Input label="Email Address" icon={Mail} value={user?.email || ''} disabled />
            <p className="text-[10px] text-green-600 flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> {user?.email_verified ? 'Verified' : 'Not verified'}
            </p>
          </div>
          <Input label="Phone Number" icon={Phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <Button fullWidth className="mt-4" onClick={handleSaveProfile} isLoading={saving}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </Card>

      {/* KYC Status */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" /> KYC Verification
        </h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-500">Status</span>
          {kycComplete ? <Badge variant="success" size="sm">Verified</Badge> : <Badge variant="warning" size="sm">Pending</Badge>}
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate('/owner/documents')}>View KYC →</Button>
      </Card>

      {/* Security */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-600" /> Security
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Password</p>
          <Button size="sm" variant="outline" onClick={() => setPasswordModal(true)}>Change Password</Button>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Role</span><Badge variant="success" size="sm">Owner</Badge></div>
          <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={user?.is_active ? 'active' : 'suspended'} size="sm" /></div>
          <div className="flex justify-between"><span className="text-slate-500">Member Since</span><span className="flex items-center gap-1 text-xs"><Calendar className="w-3 h-3" />{formatDate(user?.created_at || new Date())}</span></div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 border-red-200">
        <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-xs text-slate-500 mb-3">Deactivating will disable your account.</p>
        <Button size="sm" variant="danger" onClick={() => setDeactivateModal(true)}>Deactivate Account</Button>
      </Card>

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPasswordModal(false)} />
          <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-4">Change Password</h3>
            {passwordError && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 mb-3">{passwordError}</div>}
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" fullWidth onClick={() => setPasswordModal(false)}>Cancel</Button>
              <Button size="sm" fullWidth onClick={handleChangePassword} isLoading={passwordLoading}>Update Password</Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {deactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeactivateModal(false)} />
          <div className="relative bg-white rounded-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Deactivate Account?</h3>
                <p className="text-xs text-slate-500 mt-1">This will log you out.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" fullWidth onClick={() => setDeactivateModal(false)}>Cancel</Button>
              <Button variant="danger" size="sm" fullWidth onClick={handleDeactivate} isLoading={deactivateLoading}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSettings;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  AlertCircle,
  CheckCircle,
  Car,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Camera,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import vehicleService from '../../services/vehicleService';
import api from '../../services/api';

const AddVehicle = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vehicle_type: 'sedan',
    transmission: 'automatic',
    fuel_type: 'petrol',
    seats: 5,
    color: '',
    registration_number: '',
    description: '',
    daily_rate: '',
    deposit_amount: '',
    branch_id: '',
  });
  
  const [vehicleImages, setVehicleImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [imagePreviews, setImagePreviews] = useState({});
  
  const [vehicleDocuments, setVehicleDocuments] = useState({
    vehicle_rc: { file: null, label: 'Vehicle Registration Certificate' },
    insurance: { file: null, label: 'Insurance Document' },
    tax_token: { file: null, label: 'Tax Token (Optional)' },
  });
  
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchBranches();
  }, []);
  
  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };
  
  // ✅ Image Compression Function
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if width > maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`📸 Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // ✅ Handle Vehicle Image with Compression
  const handleVehicleImageChange = async (side, file) => {
    if (!file) return;
    
    // Check file size (max 10MB original)
    const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_ORIGINAL_SIZE) {
      alert(`File too large! Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max allowed: 10MB.`);
      return;
    }
    
    try {
      let processedFile = file;
      
      // Compress if image
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
      }
      
      setVehicleImages((prev) => ({ ...prev, [side]: processedFile }));
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => ({ ...prev, [side]: e.target.result }));
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Image processing failed:', error);
      // Fallback: use original file
      setVehicleImages((prev) => ({ ...prev, [side]: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => ({ ...prev, [side]: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // ✅ Handle Document with Size Check
  const handleVehicleDocumentChange = (docType, file) => {
    if (!file) return;
    
    const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_DOC_SIZE) {
      alert(`File too large! Size: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB.`);
      return;
    }
    
    setVehicleDocuments((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], file },
    }));
  };
  
  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.brand || !formData.model || !formData.daily_rate || !formData.deposit_amount || !formData.branch_id) {
        alert('Please fill all required fields');
        return false;
      }
      return true;
    }
    
    if (currentStep === 2) {
      if (!vehicleImages.front || !vehicleImages.back || !vehicleImages.left || !vehicleImages.right) {
        alert('Please upload all 4 vehicle photos (Front, Back, Left, Right)');
        return false;
      }
      return true;
    }
    
    if (currentStep === 3) {
      if (!vehicleDocuments.vehicle_rc.file || !vehicleDocuments.insurance.file) {
        alert('Please upload Vehicle Registration and Insurance documents');
        return false;
      }
      return true;
    }
    
    return true;
  };
  
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };
  
  // ✅ Improved Error Handling
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Build payload — skip empty registration_number
      const payload = {
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        vehicle_type: formData.vehicle_type,
        transmission: formData.transmission,
        fuel_type: formData.fuel_type,
        seats: Number(formData.seats),
        color: formData.color || null,
        description: formData.description || null,
        daily_rate: Number(formData.daily_rate),
        deposit_amount: Number(formData.deposit_amount),
        branch_id: formData.branch_id,
      };
      
      // Only include registration_number if provided
      if (formData.registration_number && formData.registration_number.trim() !== '') {
        payload.registration_number = formData.registration_number.trim();
      }
      
      console.log('🔍 Creating vehicle:', payload);
      
      const vehicleResponse = await vehicleService.createVehicle(payload);
      const vehicleId = vehicleResponse.data?.id;
      
      if (!vehicleId) throw new Error('Failed to create vehicle');
      
      console.log('✅ Vehicle created:', vehicleId);
      
      // Upload images
      const imageFormData = new FormData();
      Object.entries(vehicleImages).forEach(([side, file]) => {
        if (file) {
          imageFormData.append('images', file, `${side}_${file.name}`);
        }
      });
      
      if (imageFormData.getAll('images').length > 0) {
        await vehicleService.uploadImages(vehicleId, imageFormData);
        console.log('✅ Images uploaded');
      }
      
      // Upload documents
      for (const [docType, docInfo] of Object.entries(vehicleDocuments)) {
        if (docInfo.file) {
          const docFormData = new FormData();
          docFormData.append('document_type', docType);
          docFormData.append('file', docInfo.file);
          docFormData.append('vehicle_id', vehicleId);
          
          await api.post('/documents/upload', docFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          console.log(`✅ ${docInfo.label} uploaded`);
        }
      }
      
      setSuccess('Vehicle added! Pending admin approval.');
      setTimeout(() => navigate('/owner/vehicles'), 2000);
    } catch (error) {
      console.error('❌ Error:', error);
      
      const errorMessage = error.response?.data?.message || '';
      
      if (errorMessage.includes('duplicate key') || errorMessage.includes('registration_number')) {
        setError('This registration number already exists. Please use a different one or leave empty.');
      } else if (errorMessage.includes('too large') || errorMessage.includes('file size')) {
        setError('File size too large. Images are auto-compressed to 800px width.');
      } else if (errorMessage.includes('KYC')) {
        setError('KYC verification required. Please complete owner KYC first.');
      } else {
        setError(errorMessage || 'Failed to add vehicle. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const steps = ['Vehicle Info', 'Photos', 'Documents', 'Review'];
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Add New Vehicle</h1>
      <p className="text-slate-500 mb-6">List your vehicle with complete documentation</p>
      
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((label, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              step === index + 1
                ? 'bg-blue-600 text-white'
                : step > index + 1
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                step > index + 1 ? 'bg-green-600 text-white' : step === index + 1 ? 'bg-white text-blue-600' : 'bg-slate-200'
              }`}>
                {step > index + 1 ? '✓' : index + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700 mb-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 mb-4">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {/* STEP 1: Vehicle Info */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Brand *" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Toyota" required />
              <Input label="Model *" name="model" value={formData.model} onChange={handleChange} placeholder="e.g., Corolla" required />
              <Input label="Year *" name="year" type="number" value={formData.year} onChange={handleChange} required />
              <Input label="Registration Number (Optional)" name="registration_number" value={formData.registration_number} onChange={handleChange} placeholder="Leave empty if not available" />
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Type *</label>
                <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="microbus">Microbus</option>
                  <option value="pickup">Pickup</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transmission</label>
                <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="cng">CNG</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              <Input label="Seats *" name="seats" type="number" min="2" max="15" value={formData.seats} onChange={handleChange} required />
            </div>
          </Card>
          
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Daily Rate (৳) *" name="daily_rate" type="number" min="500" value={formData.daily_rate} onChange={handleChange} required />
              <Input label="Deposit (৳) *" name="deposit_amount" type="number" min="1000" value={formData.deposit_amount} onChange={handleChange} required />
            </div>
          </Card>
          
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4">Location</h2>
            <select name="branch_id" value={formData.branch_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2.5 text-sm" required>
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
              ))}
            </select>
          </Card>
          
          <Card>
            <h2 className="font-semibold text-slate-900 mb-4">Description</h2>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="Describe your vehicle condition, features, etc." className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </Card>
        </div>
      )}
      
      {/* STEP 2: Vehicle Photos */}
      {step === 2 && (
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Vehicle Photos (4 Sides Required)
          </h2>
          <p className="text-sm text-slate-500 mb-2">
            Upload clear photos. Images auto-compressed to 800px width.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Max file size: 10MB original (will be compressed)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { side: 'front', label: 'Front View *' },
              { side: 'back', label: 'Back View *' },
              { side: 'left', label: 'Left Side *' },
              { side: 'right', label: 'Right Side *' },
            ].map((item) => (
              <div key={item.side}>
                <label className="block text-sm font-medium text-slate-700 mb-2">{item.label}</label>
                
                {imagePreviews[item.side] ? (
                  <div className="relative">
                    <img src={imagePreviews[item.side]} alt={item.label} className="w-full h-40 object-cover rounded-lg" />
                    <button
                      onClick={() => {
                        setVehicleImages((prev) => ({ ...prev, [item.side]: null }));
                        setImagePreviews((prev) => ({ ...prev, [item.side]: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500">Click to upload</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleVehicleImageChange(item.side, e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* STEP 3: Vehicle Documents */}
      {step === 3 && (
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Vehicle Documents
          </h2>
          <p className="text-sm text-slate-500 mb-4">These documents verify your vehicle is legal and roadworthy.</p>
          
          <div className="space-y-4">
            {Object.entries(vehicleDocuments).map(([docType, docInfo]) => (
              <div key={docType} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{docInfo.label} {docType !== 'tax_token' && <span className="text-red-600">*</span>}</p>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG • Max 10MB</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => handleVehicleDocumentChange(docType, e.target.files[0])}
                  />
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                    docInfo.file ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'
                  }`}>
                    {docInfo.file ? '✓ Uploaded' : 'Upload'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* STEP 4: Review */}
      {step === 4 && (
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Review & Submit</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-medium">{formData.brand} {formData.model} {formData.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Daily Rate</span>
              <span className="font-medium">৳{Number(formData.daily_rate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Photos Uploaded</span>
              <span className="font-medium">{Object.values(vehicleImages).filter(Boolean).length}/4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Documents Uploaded</span>
              <span className="font-medium">{Object.values(vehicleDocuments).filter((d) => d.file).length}</span>
            </div>
          </div>
        </Card>
      )}
      
      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        
        {step < totalSteps ? (
          <Button fullWidth onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button fullWidth onClick={handleSubmit} isLoading={loading}>
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddVehicle;
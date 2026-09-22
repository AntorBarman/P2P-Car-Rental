// frontend/src/components/ui/CameraCapture.jsx (UPDATED)

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, Upload } from 'lucide-react';
import Button from './Button';

const CameraCapture = ({ onCapture, onClose, docType = 'face_photo', userRole = 'customer' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic content based on user role and document type
  const getModalTitle = () => {
    if (docType === 'vehicle_photo') return 'Capture Vehicle Photo';
    return userRole === 'owner' ? 'Capture Owner Face Photo' : 'Capture Face Photo';
  };

  const getGuideText = () => {
    if (docType === 'vehicle_photo') {
      return 'Position the vehicle clearly within the frame. Ensure good lighting and a full view.';
    }
    return userRole === 'owner'
      ? 'Position your face clearly in the frame. This photo will be matched with your Vehicle Registration & NID.'
      : 'Position your face in the frame and capture a clear photo. This will be matched with your NID photo.';
  };

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);

      // ✅ Check if HTTPS
      const isSecure = window.isSecureContext;
      console.log('🔍 Is secure context:', isSecure);
      console.log('🔍 Protocol:', window.location.protocol);
      console.log('🔍 Hostname:', window.location.hostname);

      if (!isSecure) {
        setError('Camera requires HTTPS. Current protocol is ' + window.location.protocol + '. Please use https://192.168.0.224:5173');
        setIsLoading(false);
        return;
      }

      // ✅ Check mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported. navigator.mediaDevices is undefined');
        setIsLoading(false);
        return;
      }

      const facingMode = docType === 'vehicle_photo' ? 'environment' : 'user';

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((err) => console.log('Play error:', err));
      }
      setIsCameraActive(true);
      setCapturedImage(null);
      console.log('✅ Camera started successfully');

    } catch (err) {
      console.error('❌ Camera error:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);

      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Click camera icon in address bar and allow access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is busy. Close other apps using camera.');
      } else if (err.name === 'SecurityError') {
        setError('Camera blocked by browser security. Use HTTPS.');
      } else {
        setError('Camera error: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [docType]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');

    // Apply selfie mirror effect only for front camera (user face capture)
    if (docType !== 'vehicle_photo') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }, [stopCamera, docType]);

  // ✅ ADD: File upload fallback
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = () => {
    if (capturedImage) {
      setIsLoading(true);

      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const fileName = `${docType}_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });

          // Passes back (file, previewUrl, docType)
          onCapture(file, capturedImage, docType);
        })
        .catch((err) => {
          console.error('Failed to process image:', err);
          setError('Failed to process image. Please retake.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* Background Overlay */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
            <Camera className="w-5 h-5 text-blue-600" />
            {getModalTitle()}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
          {getGuideText()}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs sm:text-sm text-red-700 mb-4 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Camera Display Box */}
        <div className="relative bg-slate-900 rounded-xl overflow-hidden mb-5 aspect-video flex items-center justify-center shadow-inner">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured result"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${docType !== 'vehicle_photo' ? '-scale-x-100' : ''
                  }`}
              />

              {/* Oval Overlay for Face Captures */}
              {isCameraActive && docType !== 'vehicle_photo' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-52 border-2 border-dashed border-white/70 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
                </div>
              )}

              {!isCameraActive && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 p-4 text-center">
                  <Camera className="w-12 h-12 mb-2 stroke-1 text-slate-500" />
                  <span className="text-sm font-medium text-slate-300">Camera is off</span>
                  <span className="text-xs text-slate-500 mt-1">Click "Start Camera" to begin</span>

                  {/* ✅ ADD: Upload Photo option */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo Instead
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs text-slate-300">Opening camera...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3 mb-5">
          {!capturedImage ? (
            <>
              {!isCameraActive ? (
                <>
                  <Button fullWidth onClick={startCamera} isLoading={isLoading}>
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </>
              ) : (
                <Button fullWidth onClick={capturePhoto}>
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" fullWidth onClick={handleRetake}>
                <RefreshCw className="w-4 h-4" />
                Retake
              </Button>
              <Button fullWidth variant="success" onClick={handleConfirm} isLoading={isLoading}>
                <Check className="w-4 h-4" />
                Confirm & Use
              </Button>
            </>
          )}
        </div>

        {/* Guidelines Box */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
          <p className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span> Good lighting, subjects clearly visible
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span> Direct view without blur or glare
          </p>
          {docType !== 'vehicle_photo' && (
            <p className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> No sunglasses, hats, or face coverings
            </p>
          )}
          <p className="flex items-center gap-1.5 text-amber-700 font-medium pt-1 border-t border-slate-200/60 mt-1">
            <span>⚠️</span> Photo will be cross-referenced during account verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
// frontend/src/components/kyc/FaceCapture.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle, Shield, Sun, Eye } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

const FaceCapture = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera

  // ✅ Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      // ✅ Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }

      // ✅ Request camera with specific constraints
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      console.log('📸 Requesting camera with constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraActive(true);
      console.log('✅ Camera started successfully');
      
    } catch (err) {
      console.error('❌ Camera error:', err);
      
      // ✅ Handle specific errors
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera constraints not supported. Trying alternative...');
        // Try without specific constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setCameraActive(true);
          setError('');
        } catch (fallbackErr) {
          setError('Failed to access camera: ' + fallbackErr.message);
        }
      } else {
        setError('Camera error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !cameraActive) {
      toast.warning('Camera is not active');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!canvas) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      setCapturedImage(imageDataUrl);
      console.log('✅ Photo captured successfully');
      
      // Stop camera after capture
      stopCamera();
      
    } catch (err) {
      console.error('❌ Capture error:', err);
      toast.error('Failed to capture photo');
    }
  }, [cameraActive, stopCamera]);

  const handleSubmit = useCallback(() => {
    if (!capturedImage) {
      toast.warning('Please capture a photo first');
      return;
    }

    // Convert base64 to blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'face_photo.jpg', { type: 'image/jpeg' });
        onCapture?.(file);
      })
      .catch(err => {
        console.error('❌ Error converting image:', err);
        toast.error('Failed to process photo');
      });
  }, [capturedImage, onCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (cameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  }, [cameraActive, stopCamera, startCamera]);

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Face Verification</h3>
        {onCancel && (
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Camera Area */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden mb-4" style={{ minHeight: '400px' }}>
        {/* Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-[400px] object-cover ${cameraActive ? 'block' : 'hidden'}`}
          playsInline
          muted
        />

        {/* Captured Image */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-[400px] object-cover"
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-75 p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-white text-sm mb-4">{error}</p>
              <Button onClick={startCamera} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Placeholder when no camera */}
        {!cameraActive && !capturedImage && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm mb-4">Camera is off</p>
              <Button onClick={startCamera} isLoading={loading}>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </div>
          </div>
        )}

        {/* Guide Frame */}
        {cameraActive && !capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-white rounded-full opacity-50"></div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="space-y-3">
        {cameraActive && !capturedImage && (
          <div className="flex gap-3">
            <Button fullWidth onClick={capturePhoto}>
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
            <Button variant="outline" onClick={switchCamera}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        )}

        {capturedImage && (
          <div className="flex gap-3">
            <Button fullWidth onClick={handleSubmit}>
              <Check className="w-4 h-4 mr-2" />
              Use This Photo
            </Button>
            <Button variant="outline" onClick={retakePhoto}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake
            </Button>
          </div>
        )}

        {cameraActive && (
          <Button variant="outline" fullWidth onClick={stopCamera}>
            Cancel
          </Button>
        )}
      </div>

      {/* Guidelines */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          Good lighting, subjects clearly visible
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          Direct view without blur or glare
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          No sunglasses, hats, or face coverings
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-600">
          <AlertCircle className="w-4 h-4" />
          Photo will be cross-referenced during account verification
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;
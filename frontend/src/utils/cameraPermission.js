// frontend/src/utils/cameraPermission.js

export const checkCameraPermission = async () => {
  try {
    // Check if browser supports permissions API
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'camera' });
      console.log('📸 Camera permission status:', result.state);
      return result.state; // 'granted', 'denied', 'prompt'
    }
    return 'prompt';
  } catch (error) {
    console.error('Failed to check camera permission:', error);
    return 'prompt';
  }
};

export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};
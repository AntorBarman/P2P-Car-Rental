// backend/src/middlewares/upload.js

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

// ============================================
// ✅ VEHICLE IMAGES STORAGE
// ============================================
const vehicleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'udrive-bangladesh/vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
});

// ============================================
// ✅ AVATAR STORAGE
// ============================================
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'udrive-bangladesh/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
    ],
  },
});

// ============================================
// ✅ DOCUMENT STORAGE
// ============================================
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'udrive-bangladesh/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest('Invalid file type. Only JPG, PNG, WebP, and PDF are allowed'),
      false
    );
  }
};

// ============================================
// ✅ UPLOAD INSTANCES (Export as object)
// ============================================
const uploadVehicleImages = multer({
  storage: vehicleStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// ✅ Export as object
module.exports = {
  uploadVehicleImages,
  uploadAvatar,
  uploadDocument,
};
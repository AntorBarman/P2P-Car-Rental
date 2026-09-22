// backend/src/routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');
const userService = require('../services/userService');
const authMiddleware = require('../middlewares/auth');
// ✅ FIX: Destructure uploadAvatar
const { uploadAvatar } = require('../middlewares/upload');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();

router.use(authMiddleware);

// Get profile
router.get('/profile', userController.getProfile);

// Update profile
router.put('/profile', userController.updateProfile);

// ✅ Upload avatar
router.post(
  '/avatar',
  uploadAvatar.single('avatar'),
  asyncHandler(async (req, res) => {
    console.log('📤 Avatar upload request');
    console.log('📁 req.file:', req.file);
    
    if (!req.file) {
      throw ApiError.badRequest('Avatar file is required');
    }
    
    // ✅ CloudinaryStorage already uploaded file
    const avatarUrl = req.file.path || req.file.secure_url;
    
    if (!avatarUrl) {
      throw ApiError.badRequest('Failed to get avatar URL');
    }
    
    // Update user avatar
    await userService.uploadAvatar(req.user.id, { path: avatarUrl });
    
    res.json(ApiResponse.ok('Avatar uploaded successfully', { avatarUrl }));
  })
);

// Check KYC status
router.get('/kyc-status', userController.checkKYCStatus);

// Change password
router.post('/change-password', userController.changePassword);

module.exports = router;
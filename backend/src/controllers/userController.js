// backend/src/controllers/userController.js

const userRepository = require('../repositories/userRepository');
const userService = require('../services/userService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const db = require('../config/database');
const bcrypt = require('bcrypt');

/*
|--------------------------------------------------------------------------
| GET USER PROFILE
|--------------------------------------------------------------------------
*/

const getProfile = asyncHandler(async (req, res) => {
  console.log('🔍 Getting profile for user:', req.user.id);
  
  const user = await userRepository.findById(req.user.id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // Remove password_hash from response
  const { password_hash, ...safeUser } = user;
  
  res.json(ApiResponse.ok('Profile retrieved', safeUser));
});

/*
|--------------------------------------------------------------------------
| UPDATE USER PROFILE
|--------------------------------------------------------------------------
*/

const updateProfile = asyncHandler(async (req, res) => {
  console.log('🔍 Updating profile:', req.body);
  
  const { name, phone } = req.body;
  
  if (!name && !phone) {
    throw ApiError.badRequest('Name or phone is required');
  }
  
  // Phone validation
  if (phone) {
    const phoneRegex = /^(\+8801|01)[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      throw ApiError.badRequest('Invalid Bangladesh phone number format (e.g., 01700000000)');
    }
  }
  
  const result = await db.query(
    `UPDATE users 
     SET name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, email, phone, role, avatar_url, email_verified, is_active, created_at`,
    [name, phone, req.user.id]
  );
  
  if (result.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }
  
  res.json(ApiResponse.ok('Profile updated', result.rows[0]));
});

/*
|--------------------------------------------------------------------------
| CHECK KYC STATUS
|--------------------------------------------------------------------------
*/

const checkKYCStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  console.log('🔍 Checking KYC status for user:', userId);
  
  const result = await db.query(
    `SELECT d.id, d.document_type, d.status, d.rejection_reason, d.created_at
     FROM documents d
     WHERE d.user_id = $1 
     AND d.document_type IN ('nid_front', 'nid_back', 'face_photo')
     AND d.is_active = true
     ORDER BY d.created_at DESC`,
    [userId]
  );
  
  const documents = result.rows;
  const requiredDocs = ['nid_front', 'nid_back', 'face_photo'];
  const approvedDocs = documents.filter(d => d.status === 'approved');
  const pendingDocs = documents.filter(d => d.status === 'pending');
  const rejectedDocs = documents.filter(d => d.status === 'rejected');
  const approvedTypes = approvedDocs.map(d => d.document_type);
  const missingDocs = requiredDocs.filter(type => !approvedTypes.includes(type));
  
  const isKYCVerified = missingDocs.length === 0;
  
  console.log('📊 KYC Summary:', {
    total: documents.length,
    approved: approvedDocs.length,
    pending: pendingDocs.length,
    rejected: rejectedDocs.length,
    missing: missingDocs,
    isVerified: isKYCVerified
  });
  
  res.json(ApiResponse.ok('KYC status retrieved', {
    isKYCVerified,
    status: isKYCVerified ? 'verified' : 'pending',
    documents,
    approvedDocuments: approvedTypes,
    missingDocuments: missingDocs,
    hasRejected: rejectedDocs.length > 0,
    rejectionReasons: rejectedDocs.map(d => ({
      document_type: d.document_type,
      reason: d.rejection_reason
    }))
  }));
});

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current and new password are required');
  }
  
  const user = await userRepository.findById(req.user.id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  
  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters');
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await db.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, req.user.id]
  );
  
  res.json(ApiResponse.ok('Password changed successfully'));
});

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  getProfile,
  updateProfile,
  checkKYCStatus,
  changePassword
};
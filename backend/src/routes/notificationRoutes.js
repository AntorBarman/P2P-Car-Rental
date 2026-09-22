const express = require('express');
const authMiddleware = require('../middlewares/auth');
const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// ============================================
// ✅ GET MY NOTIFICATIONS
// ============================================
router.get('/my', authMiddleware, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const result = await notificationService.getByUser(
    req.user.id,
    parseInt(limit),
    parseInt(offset)
  );
  res.json(ApiResponse.ok('Notifications retrieved', result));
}));

// ============================================
// ✅ GET UNREAD COUNT
// ============================================
router.get('/unread/count', authMiddleware, asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json(ApiResponse.ok('Unread count retrieved', { count }));
}));

// ============================================
// ✅ MARK AS READ
// ============================================
router.patch('/:id/read', authMiddleware, asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json(ApiResponse.ok('Notification marked as read', notification));
}));

// ============================================
// ✅ MARK ALL AS READ
// ============================================
router.post('/read-all', authMiddleware, asyncHandler(async (req, res) => {
  const notifications = await notificationService.markAllAsRead(req.user.id);
  res.json(ApiResponse.ok('All notifications marked as read', notifications));
}));

// ============================================
// ✅ DELETE NOTIFICATION
// ============================================
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await notificationService.deleteById(req.params.id, req.user.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json(ApiResponse.ok('Notification deleted'));
}));

module.exports = router;
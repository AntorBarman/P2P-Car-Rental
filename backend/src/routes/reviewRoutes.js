// backend/src/routes/reviewRoutes.js

const express = require('express');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// ✅ Public routes
router.get('/recent', reviewController.getRecentReviews);
router.get('/vehicle/:vehicleId', reviewController.getVehicleReviews);
router.get('/vehicle/:vehicleId/rating', reviewController.getVehicleRating);

// ✅ Protected routes
router.post('/', authMiddleware, reviewController.createReview);
router.get('/owner', authMiddleware, reviewController.getOwnerReviews);
router.put('/:reviewId', authMiddleware, reviewController.updateReview);
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);
router.get('/check/:bookingId', authMiddleware, reviewController.checkCanReview);

module.exports = router;
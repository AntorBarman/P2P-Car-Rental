// backend/src/controllers/reviewController.js

const reviewService = require('../services/reviewService');
const ApiError = require('../utils/ApiError');
const db = require('../config/database');

class ReviewController {
  async createReview(req, res) {
    try {
      const review = await reviewService.createReview({
        ...req.body,
        customerId: req.user.id
      });
      
      res.status(201).json({
        success: true,
        data: review,
        message: 'Review submitted successfully!'
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getVehicleReviews(req, res) {
    try {
      const { vehicleId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const reviews = await reviewService.getVehicleReviews(
        vehicleId, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getVehicleRating(req, res) {
    try {
      const { vehicleId } = req.params;
      const rating = await reviewService.getVehicleRating(vehicleId);
      
      res.json({
        success: true,
        data: rating
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getOwnerReviews(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const reviews = await reviewService.getOwnerReviews(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const review = await reviewService.updateReview(
        reviewId,
        req.user.id,
        req.body
      );
      
      res.json({
        success: true,
        data: review,
        message: 'Review updated successfully!'
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      await reviewService.deleteReview(reviewId, req.user.id);
      
      res.json({
        success: true,
        message: 'Review deleted successfully!'
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async checkCanReview(req, res) {
    try {
      const { bookingId } = req.params;
      const result = await reviewService.checkCanReview(
        bookingId,
        req.user.id
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ NEW: Get recent reviews for home page
  async getRecentReviews(req, res) {
    try {
      const { limit = 3 } = req.query;
      
      const result = await db.query(
        `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
          u.name as customer_name, u.avatar_url as customer_avatar,
          v.brand, v.model, v.year
         FROM reviews r
         JOIN users u ON r.customer_id = u.id
         JOIN vehicles v ON r.vehicle_id = v.id
         WHERE r.is_public = true
         ORDER BY r.created_at DESC
         LIMIT $1`,
        [parseInt(limit)]
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Error getting recent reviews:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to load reviews',
        data: []
      });
    }
  }
}

module.exports = new ReviewController();
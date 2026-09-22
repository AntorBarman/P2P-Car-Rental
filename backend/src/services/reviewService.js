const reviewModel = require('../models/reviewModel');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');

class ReviewService {
  async createReview(data) {
    const { bookingId, customerId, rating, title, comment } = data;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw ApiError.badRequest('Rating must be between 1 and 5');
    }
    
    // Validate comment
    if (!comment || comment.trim().length < 10) {
      throw ApiError.badRequest('Review comment must be at least 10 characters');
    }
    
    // Check if can review
    const check = await reviewModel.checkCanReview(bookingId, customerId);
    if (!check.canReview) {
      throw ApiError.badRequest(check.reason);
    }
    
    const booking = check.booking;
    
    // Create review
    const review = await reviewModel.create({
      bookingId,
      vehicleId: booking.vehicle_id,
      customerId,
      rating,
      title: title || null,
      comment: comment.trim()
    });
    
    // Notify vehicle owner
    try {
      if (check.vehicle.owner_id) {
        await notificationService.create({
          userId: check.vehicle.owner_id,
          type: 'NEW_REVIEW',
          title: '⭐ New Review Received',
          message: `You received a ${rating}-star review for ${check.vehicle.brand} ${check.vehicle.model}!`,
          metadata: { 
            reviewId: review.id, 
            vehicleId: booking.vehicle_id,
            bookingId: booking.id
          }
        });
      }
    } catch (error) {
      console.error('❌ Notification error:', error.message);
    }
    
    return review;
  }

  async getVehicleReviews(vehicleId, page = 1, limit = 10) {
    return await reviewModel.getByVehicle(vehicleId, page, limit);
  }

  async getOwnerReviews(ownerId, page = 1, limit = 20) {
    return await reviewModel.getByOwner(ownerId, page, limit);
  }

  async getVehicleRating(vehicleId) {
    return await reviewModel.getVehicleRatingSummary(vehicleId);
  }

  async updateReview(reviewId, customerId, data) {
    const review = await reviewModel.findById(reviewId);
    
    if (!review) {
      throw ApiError.notFound('Review not found');
    }
    
    if (review.customer_id !== customerId) {
      throw ApiError.forbidden('You can only edit your own reviews');
    }
    
    return await reviewModel.update(reviewId, data);
  }

  async deleteReview(reviewId, customerId) {
    const review = await reviewModel.findById(reviewId);
    
    if (!review) {
      throw ApiError.notFound('Review not found');
    }
    
    if (review.customer_id !== customerId) {
      throw ApiError.forbidden('You can only delete your own reviews');
    }
    
    return await reviewModel.delete(reviewId);
  }

  async checkCanReview(bookingId, customerId) {
    return await reviewModel.checkCanReview(bookingId, customerId);
  }
}

module.exports = new ReviewService();
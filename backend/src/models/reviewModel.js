const db = require('../config/database');

class ReviewModel {
  async create(data) {
    const { bookingId, vehicleId, customerId, rating, title, comment } = data;
    
    const result = await db.query(
      `INSERT INTO reviews (
        booking_id, vehicle_id, customer_id, 
        rating, title, comment
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [bookingId, vehicleId, customerId, rating, title, comment]
    );
    
    return result.rows[0];
  }

  async findById(reviewId) {
    const result = await db.query(
      `SELECT r.*, 
        u.name as customer_name, 
        u.avatar_url as customer_avatar,
        v.brand, v.model, v.year,
        v.owner_id as vehicle_owner_id
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.id = $1`,
      [reviewId]
    );
    return result.rows[0];
  }

  async findByBookingId(bookingId) {
    const result = await db.query(
      `SELECT * FROM reviews WHERE booking_id = $1`,
      [bookingId]
    );
    return result.rows[0];
  }

  async getByVehicle(vehicleId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT r.*, 
        u.name as customer_name, 
        u.avatar_url as customer_avatar
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.vehicle_id = $1 AND r.is_public = true
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [vehicleId, limit, offset]
    );
    
    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM reviews 
       WHERE vehicle_id = $1 AND is_public = true`,
      [vehicleId]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    return {
      reviews: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getByOwner(ownerId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT r.*, 
        u.name as customer_name, 
        u.avatar_url as customer_avatar,
        v.brand, v.model, v.year,
        v.registration_number
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.owner_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]
    );
    
    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM reviews r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.owner_id = $1`,
      [ownerId]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    return {
      reviews: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getVehicleRatingSummary(vehicleId) {
    const result = await db.query(
      `SELECT * FROM vehicle_ratings_summary WHERE vehicle_id = $1`,
      [vehicleId]
    );
    
    return result.rows[0] || {
      vehicle_id: vehicleId,
      total_reviews: 0,
      average_rating: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0
    };
  }

  async update(reviewId, data) {
    const { rating, title, comment, isPublic } = data;
    
    const result = await db.query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           title = COALESCE($2, title),
           comment = COALESCE($3, comment),
           is_public = COALESCE($4, is_public),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [rating, title, comment, isPublic, reviewId]
    );
    
    return result.rows[0];
  }

  async delete(reviewId) {
    const result = await db.query(
      `DELETE FROM reviews WHERE id = $1 RETURNING id`,
      [reviewId]
    );
    return result.rows[0];
  }

  async checkCanReview(bookingId, customerId) {
    const result = await db.query(
      `SELECT b.*, 
        v.owner_id as vehicle_owner_id,
        v.brand, v.model,
        r.id as review_id
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN reviews r ON r.booking_id = b.id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [bookingId, customerId]
    );
    
    if (result.rows.length === 0) {
      return { 
        canReview: false, 
        reason: 'Booking not found or does not belong to you' 
      };
    }
    
    const booking = result.rows[0];
    
    if (booking.review_id) {
      return { canReview: false, reason: 'You have already reviewed this booking' };
    }
    
    if (booking.status !== 'completed') {
      return { 
        canReview: false, 
        reason: `Booking must be completed before reviewing (current status: ${booking.status})` 
      };
    }
    
    return { 
      canReview: true, 
      booking,
      vehicle: {
        id: booking.vehicle_id,
        brand: booking.brand,
        model: booking.model,
        owner_id: booking.vehicle_owner_id
      }
    };
  }
}

module.exports = new ReviewModel();
// backend/src/services/bookingService.js (COMPLETE)

const bookingRepository = require('../repositories/bookingRepository');
const vehicleRepository = require('../repositories/vehicleRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const db = require('../config/database');
const notificationService = require('./notificationService');

class BookingService {
  
  // ============================================
  // ✅ CANCELLATION REFUND
  // ============================================
  calculateCancellationRefund(booking) {
    const now = new Date();
    const pickupDate = new Date(booking.pickup_date);
    const hoursUntilPickup = Math.max(0, (pickupDate - now) / (1000 * 60 * 60));
    
    if (hoursUntilPickup < 6) {
      return { allowed: false, refundPercent: 0, message: 'Cannot cancel within 6 hours of pickup' };
    } else if (hoursUntilPickup < 12) {
      return { allowed: true, refundPercent: 25, message: '25% refund available (6-12 hours before pickup)' };
    } else if (hoursUntilPickup < 24) {
      return { allowed: true, refundPercent: 50, message: '50% refund available (12-24 hours before pickup)' };
    } else if (hoursUntilPickup < 48) {
      return { allowed: true, refundPercent: 75, message: '75% refund available (24-48 hours before pickup)' };
    } else {
      return { allowed: true, refundPercent: 100, message: '100% refund available (48+ hours before pickup)' };
    }
  }

  // ============================================
  // ✅ CHECK VEHICLE AVAILABILITY (Database Level)
  // ============================================
  async checkVehicleAvailability(vehicleId, pickupDate, returnDate) {
    console.log('🔍 Checking availability for vehicle:', vehicleId);
    console.log('🔍 Dates:', { pickupDate, returnDate });
    
    const result = await db.query(
      `SELECT id, customer_id, pickup_date, return_date, status
       FROM bookings
       WHERE vehicle_id = $1
       AND status IN ('pending_payment', 'confirmed', 'ongoing')
       AND (
         $2::date <= return_date 
         AND $3::date >= pickup_date
       )`,
      [vehicleId, pickupDate, returnDate]
    );
    
    console.log('📊 Overlapping bookings found:', result.rows.length);
    console.log('📊 Details:', result.rows);
    
    return {
      available: result.rows.length === 0,
      overlappingBookings: result.rows,
      overlapCount: result.rows.length
    };
  }

  // ============================================
  // ✅ CREATE HOLD (With Transaction Lock + Double Booking Protection)
  // ============================================
  async createHold(vehicleId, customerId, pickupDate, returnDate, pickupTime = '10:00', returnTime = '10:00') {
    console.log('======================================');
    console.log('🔍 CREATE HOLD - DOUBLE BOOKING CHECK');
    console.log('======================================');
    console.log('🔍 Vehicle ID:', vehicleId);
    console.log('🔍 Customer ID:', customerId);
    console.log('🔍 Pickup Date:', pickupDate);
    console.log('🔍 Return Date:', returnDate);
    console.log('🔍 Pickup Time:', pickupTime);
    console.log('🔍 Return Time:', returnTime);
    
    // ✅ Validate customer
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      console.error('❌ Invalid customer ID');
      throw ApiError.unauthorized('Please login to create a booking');
    }
    
    // ✅ Validate dates
    if (!pickupDate || !returnDate) {
      throw ApiError.badRequest('Pickup and return dates are required');
    }
    
    const pickupDateTime = new Date(pickupDate);
    const returnDateTime = new Date(returnDate);
    
    if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
      throw ApiError.badRequest('Invalid date format');
    }
    
    if (returnDateTime <= pickupDateTime) {
      throw ApiError.badRequest('Return date must be after pickup date');
    }
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      console.log('🔒 Transaction started');
      
      // ✅ STEP 1: LOCK VEHICLE ROW (prevents concurrent bookings)
      const vehicleResult = await client.query(
        `SELECT * FROM vehicles 
         WHERE id = $1 AND is_deleted = FALSE 
         FOR UPDATE`,
        [vehicleId]
      );
      
      if (vehicleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw ApiError.notFound('Vehicle not found');
      }
      
      const vehicle = vehicleResult.rows[0];
      console.log('🔒 Vehicle locked:', vehicle.brand, vehicle.model, 'Status:', vehicle.status);
      
      // ✅ STEP 2: CHECK OVERLAPPING BOOKINGS (ANY USER)
      const overlapResult = await client.query(
        `SELECT id, customer_id, pickup_date, return_date, status
         FROM bookings
         WHERE vehicle_id = $1
         AND status IN ('pending_payment', 'confirmed', 'ongoing')
         AND (
           $2::date <= return_date 
           AND $3::date >= pickup_date
         )
         FOR UPDATE`,
        [vehicleId, pickupDate, returnDate]
      );
      
      // ✅ STEP 3: BLOCK IF OVERLAP EXISTS
      if (overlapResult.rows.length > 0) {
        const existing = overlapResult.rows[0];
        console.error('❌ DOUBLE BOOKING ATTEMPT BLOCKED!');
        console.error('❌ Existing booking:', existing);
        await client.query('ROLLBACK');
        throw ApiError.conflict(
          `Vehicle already booked from ${existing.pickup_date} to ${existing.return_date} (Booking ID: ${existing.id.slice(0, 8)})`
        );
      }
      
      console.log('✅ No overlapping bookings - Vehicle available');
      
      // ✅ STEP 4: Check vehicle status
      if (vehicle.status !== 'rental_ready' && vehicle.status !== 'approved') {
        await client.query('ROLLBACK');
        throw ApiError.badRequest(`Vehicle is not available. Status: ${vehicle.status}`);
      }
      
      // ✅ STEP 5: Check if user is booking own vehicle
      if (vehicle.owner_id === customerId) {
        await client.query('ROLLBACK');
        throw ApiError.badRequest('You cannot book your own vehicle');
      }
      
      // ✅ STEP 6: Calculate amounts
      const days = Math.ceil((returnDateTime - pickupDateTime) / (1000 * 60 * 60 * 24));
      
      if (days < 1) {
        await client.query('ROLLBACK');
        throw ApiError.badRequest('Booking must be at least 1 day');
      }
      
      const dailyRate = Number(vehicle.daily_rate);
      const depositAmount = Number(vehicle.deposit_amount);
      const rentalAmount = dailyRate * days;
      const totalAmount = rentalAmount + depositAmount;
      
      console.log('💰 Amounts:', { days, dailyRate, rentalAmount, depositAmount, totalAmount });
      
      // ✅ STEP 7: Set hold expiry (15 minutes)
      const holdExpiry = new Date();
      holdExpiry.setMinutes(holdExpiry.getMinutes() + 15);
      
      // ✅ STEP 8: Create booking
      const result = await client.query(
        `INSERT INTO bookings (
          vehicle_id, customer_id, pickup_date, return_date,
          pickup_time, return_time,
          daily_rate_snapshot, deposit_amount_snapshot,
          rental_amount, total_amount,
          status, hold_expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_payment', $11, NOW(), NOW())
        RETURNING *`,
        [
          vehicleId, 
          customerId, 
          pickupDate, 
          returnDate,
          pickupTime,
          returnTime,
          dailyRate,
          depositAmount,
          rentalAmount,
          totalAmount,
          holdExpiry
        ]
      );
      
      const booking = result.rows[0];
      
      await client.query('COMMIT');
      console.log('✅ Booking created successfully:', booking.id);
      
      // ✅ STEP 9: Send notification (outside transaction)
      try {
        const customer = await userRepository.findById(customerId);
        if (customer) {
          await notificationService.bookingCreated(booking, customer, vehicle);
          console.log('📢 Booking notification sent');
        }
      } catch (notifError) {
        console.error('❌ Notification error:', notifError.message);
      }
      
      return {
        booking,
        bookingId: booking.id,
        holdExpiresAt: holdExpiry,
        totalAmount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Booking creation failed:', error.message);
      throw error;
    } finally {
      client.release();
      console.log('🔓 Database client released');
    }
  }
  
  // ============================================
  // ✅ RELEASE HOLD
  // ============================================
  async releaseHold(bookingId, customerId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `UPDATE bookings 
         SET status = 'cancelled', 
             updated_at = NOW()
         WHERE id = $1 
         AND customer_id = $2 
         AND status = 'pending_payment'
         RETURNING *`,
        [bookingId, customerId]
      );
      
      if (result.rows.length === 0) {
        throw ApiError.notFound('Booking not found or already processed');
      }
      
      await client.query('COMMIT');
      
      console.log('✅ Hold released:', bookingId);
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============================================
  // ✅ CONFIRM BOOKING (After Payment)
  // ============================================
  async confirmBooking(bookingId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `UPDATE bookings 
         SET status = 'confirmed', 
             hold_expires_at = NULL,
             updated_at = NOW()
         WHERE id = $1 
         AND status = 'pending_payment'
         RETURNING *`,
        [bookingId]
      );
      
      if (result.rows.length === 0) {
        throw ApiError.badRequest('Booking not found or already confirmed');
      }
      
      await client.query('COMMIT');
      
      console.log('✅ Booking confirmed:', bookingId);
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============================================
  // ✅ CREATE BOOKING (Wrapper)
  // ============================================
  async createBooking(data, userId) {
    return this.createHold(
      data.vehicleId, 
      userId, 
      data.pickupDate, 
      data.returnDate,
      data.pickupTime,
      data.returnTime
    );
  }
  
  // ============================================
  // ✅ GET BOOKING BY ID
  // ============================================
  async getBookingById(id, userId, role) {
    const booking = await bookingRepository.findById(id);
    
    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }
    
    const now = new Date();
    const pickupDate = new Date(booking.pickup_date);
    const returnDate = new Date(booking.return_date);
    
    if (booking.status === 'confirmed' && now > returnDate) {
      await bookingRepository.updateStatus(id, 'completed');
      booking.status = 'completed';
    }
    
    if (booking.status === 'confirmed' && now > pickupDate && now <= returnDate) {
      await bookingRepository.updateStatus(id, 'ongoing');
      booking.status = 'ongoing';
    }
    
    const isCustomer = booking.customer_id === userId;
    const isOwner = booking.owner_id === userId;
    const isAdmin = role === 'admin' || role === 'staff';
    
    if (!isCustomer && !isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to view this booking');
    }
    
    const refundInfo = this.calculateCancellationRefund(booking);
    booking.canCancel = refundInfo.allowed && booking.status === 'confirmed';
    booking.cancellationInfo = refundInfo;
    
    return booking;
  }
  
  // ============================================
  // ✅ GET MY BOOKINGS
  // ============================================
  async getMyBookings(userId, page = 1, limit = 10) {
    const result = await bookingRepository.findByCustomerId(userId, page, limit);
    
    result.bookings = result.bookings.map(booking => {
      const refundInfo = this.calculateCancellationRefund(booking);
      booking.canCancel = refundInfo.allowed && booking.status === 'confirmed';
      booking.cancellationInfo = refundInfo;
      return booking;
    });
    
    return result;
  }
  
  // ============================================
  // ✅ GET OWNER BOOKINGS
  // ============================================
  async getOwnerBookings(ownerId) {
    const bookings = await bookingRepository.findByOwnerId(ownerId);
    
    return bookings.map(booking => {
      const refundInfo = this.calculateCancellationRefund(booking);
      booking.canCancel = refundInfo.allowed && booking.status === 'confirmed';
      booking.cancellationInfo = refundInfo;
      return booking;
    });
  }
  
  // ============================================
  // ✅ CANCEL BOOKING
  // ============================================
  async cancelBooking(id, userId, role, cancelReason) {
    const booking = await bookingRepository.findById(id);
    
    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }
    
    const isCustomer = booking.customer_id === userId;
    const isOwner = booking.owner_id === userId;
    const isAdmin = role === 'admin' || role === 'staff';
    
    if (!isCustomer && !isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to cancel this booking');
    }
    
    if (booking.status === 'completed') {
      throw ApiError.badRequest('Cannot cancel a completed booking');
    }
    
    if (booking.status === 'cancelled') {
      throw ApiError.badRequest('Booking is already cancelled');
    }
    
    const now = new Date();
    const pickupDate = new Date(booking.pickup_date);
    
    if (now >= pickupDate) {
      throw ApiError.badRequest('Cannot cancel a booking that has already started');
    }
    
    const refundInfo = this.calculateCancellationRefund(booking);
    
    if (!refundInfo.allowed) {
      throw ApiError.badRequest(refundInfo.message);
    }
    
    const rentalAmount = Number(booking.rental_amount || booking.total_amount);
    const depositAmount = Number(booking.deposit_amount_snapshot || 0);
    const totalAmount = rentalAmount + depositAmount;
    const refundAmount = (rentalAmount * refundInfo.refundPercent) / 100 + depositAmount;
    const cancellationFee = rentalAmount - (rentalAmount * refundInfo.refundPercent) / 100;
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const updated = await client.query(
        `UPDATE bookings 
         SET status = 'cancelled', 
             cancel_reason = $1,
             cancelled_by = $2,
             cancelled_at = NOW(),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [cancelReason || 'Cancelled by customer', userId, id]
      );
      
      if (refundAmount > 0) {
        await client.query(
          `INSERT INTO wallet_transactions (
            user_id, booking_id, type, amount,
            transaction_type, description, reference_id
          ) VALUES ($1, $2, 'credit', $3, 'refund', $4, $5)`,
          [userId, id, refundAmount, `Refund for cancelled booking #${id.slice(0, 8)}`, id]
        );
        
        await client.query(
          `UPDATE payments 
           SET status = 'refunded', 
               refunded_at = NOW(),
               refund_amount = $1,
               updated_at = NOW()
           WHERE booking_id = $2`,
          [refundAmount, id]
        );
      }
      
      await client.query('COMMIT');
      
      return {
        booking: updated.rows[0],
        refund: {
          totalAmount,
          refundAmount,
          cancellationFee,
          refundPercent: refundInfo.refundPercent,
          message: refundInfo.message
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============================================
  // ✅ UPDATE BOOKING STATUS
  // ============================================
  async updateBookingStatus(id, status, userId, role) {
    const booking = await bookingRepository.findById(id);
    
    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }
    
    if (role !== 'admin' && role !== 'staff') {
      throw ApiError.forbidden('Only admin can update booking status');
    }
    
    const validStatuses = ['pending_payment', 'confirmed', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest('Invalid booking status');
    }
    
    const updated = await bookingRepository.updateStatus(id, status);
    return updated;
  }
}

module.exports = new BookingService();
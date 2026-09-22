// backend/src/controllers/bookingController.js (COMPLETE FIXED)

const bookingService = require('../services/bookingService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/*
|--------------------------------------------------------------------------
| CREATE BOOKING (Hold)
|--------------------------------------------------------------------------
*/

const createBooking = asyncHandler(async (req, res) => {
  console.log('======================================');
  console.log('🔍 CREATE BOOKING');
  console.log('======================================');
  console.log('🔍 Body:', req.body);
  console.log('🔍 User:', req.user);
  console.log('🔍 User ID:', req.user?.id);
  
  const { vehicleId, pickupDate, returnDate, pickupTime = '10:00', returnTime = '10:00' } = req.body;
  
  // ✅ Validate user
  if (!req.user || !req.user.id) {
    console.error('❌ User not authenticated');
    return res.status(401).json({
      success: false,
      message: 'User not authenticated. Please login again.'
    });
  }
  
  // Validate vehicleId
  if (!vehicleId) {
    throw ApiError.badRequest('Vehicle ID is required');
  }
  
  // Validate dates
  if (!pickupDate) {
    throw ApiError.badRequest('Pickup date is required');
  }
  
  if (!returnDate) {
    throw ApiError.badRequest('Return date is required');
  }
  
  // Validate date format
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  
  if (isNaN(pickup.getTime())) {
    throw ApiError.badRequest('Invalid pickup date format');
  }
  
  if (isNaN(returnD.getTime())) {
    throw ApiError.badRequest('Invalid return date format');
  }
  
  if (returnD <= pickup) {
    throw ApiError.badRequest('Return date must be after pickup date');
  }
  
  try {
    console.log('🔍 Calling createHold with positional args...');
    console.log('🔍 Args:', {
      vehicleId,
      customerId: req.user.id,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime
    });
    
    // ✅ FIX: Use positional arguments (not object)
    const result = await bookingService.createHold(
      vehicleId,           // ✅ 1st arg
      req.user.id,         // ✅ 2nd arg (customerId)
      pickupDate,          // ✅ 3rd arg
      returnDate,          // ✅ 4th arg
      pickupTime,          // ✅ 5th arg
      returnTime           // ✅ 6th arg
    );
    
    console.log('✅ Booking created:', result);
    
    res.status(201).json({
      success: true,
      message: 'Booking hold created successfully',
      data: {
        booking: result.booking,
        bookingId: result.booking.id,
        holdExpiresAt: result.holdExpiresAt,
        totalAmount: result.totalAmount,
        gatewayUrl: result.gatewayUrl || null,
      }
    });
  } catch (error) {
    console.error('❌ Booking creation error:', error.message);
    console.error('❌ Error statusCode:', error.statusCode);
    console.error('❌ Full error:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
});

/*
|--------------------------------------------------------------------------
| RELEASE HOLD
|--------------------------------------------------------------------------
*/

const releaseHold = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  console.log('🔍 Releasing hold:', bookingId);
  
  const result = await bookingService.releaseHold(bookingId, req.user.id);
  
  res.json({
    success: true,
    message: 'Hold released successfully',
    data: result
  });
});

/*
|--------------------------------------------------------------------------
| CONFIRM BOOKING (Admin only)
|--------------------------------------------------------------------------
*/

const confirmBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  console.log('🔍 Confirming booking:', bookingId);
  
  const result = await bookingService.confirmBooking(bookingId);
  
  res.json({
    success: true,
    message: 'Booking confirmed',
    data: result
  });
});

/*
|--------------------------------------------------------------------------
| GET BOOKING BY ID
|--------------------------------------------------------------------------
*/

const getBookingById = asyncHandler(async (req, res) => {
  console.log('🔍 Getting booking by ID:', req.params.id);
  console.log('🔍 User:', req.user.id);
  
  const bookingId = req.params.id;
  
  if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
    throw ApiError.badRequest('Invalid booking ID');
  }
  
  try {
    const booking = await bookingService.getBookingById(
      bookingId,
      req.user.id,
      req.user.role
    );
    
    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error getting booking:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load booking',
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET MY BOOKINGS (Customer)
|--------------------------------------------------------------------------
*/

const getMyBookings = asyncHandler(async (req, res) => {
  console.log('🔍 Getting my bookings');
  console.log('🔍 User:', req.user?.id);
  console.log('🔍 Query params:', req.query);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const result = await bookingService.getMyBookings(
      req.user.id,
      page,
      limit
    );
    
    console.log('✅ Bookings found:', result.bookings?.length || 0);
    
    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: result.bookings || [],
      pagination: result.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('❌ Error in getMyBookings:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to load bookings: ' + error.message,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET OWNER BOOKINGS
|--------------------------------------------------------------------------
*/

const getOwnerBookings = asyncHandler(async (req, res) => {
  console.log('🔍 Getting owner bookings for:', req.user.id);
  
  try {
    const bookings = await bookingService.getOwnerBookings(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Owner bookings retrieved successfully',
      data: bookings
    });
  } catch (error) {
    console.error('❌ Error getting owner bookings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load bookings',
      data: [],
    });
  }
});

/*
|--------------------------------------------------------------------------
| CANCEL BOOKING
|--------------------------------------------------------------------------
*/

const cancelBooking = asyncHandler(async (req, res) => {
  console.log('🔍 Cancelling booking:', req.params.id);
  console.log('🔍 User:', req.user.id);
  console.log('🔍 Reason:', req.body.cancel_reason);
  
  const bookingId = req.params.id;
  
  if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
    throw ApiError.badRequest('Invalid booking ID');
  }
  
  try {
    const booking = await bookingService.cancelBooking(
      bookingId,
      req.user.id,
      req.user.role,
      req.body.cancel_reason || ''
    );
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE BOOKING STATUS (Admin/Staff)
|--------------------------------------------------------------------------
*/

const updateBookingStatus = asyncHandler(async (req, res) => {
  console.log('🔍 Updating booking status:', req.params.id);
  console.log('🔍 New status:', req.body.status);
  
  const bookingId = req.params.id;
  const newStatus = req.body.status;
  
  if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
    throw ApiError.badRequest('Invalid booking ID');
  }
  
  const validStatuses = ['confirmed', 'active', 'completed', 'cancelled', 'ongoing'];
  if (!validStatuses.includes(newStatus)) {
    throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  try {
    const booking = await bookingService.updateBookingStatus(
      bookingId,
      newStatus,
      req.user.id,
      req.user.role
    );
    
    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error updating booking status:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update booking status',
    });
  }
});

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  createBooking,
  releaseHold,
  confirmBooking,
  getBookingById,
  getMyBookings,
  getOwnerBookings,
  cancelBooking,
  updateBookingStatus,
};
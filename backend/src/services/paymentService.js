// backend/src/services/paymentService.js

const paymentRepository = require('../repositories/paymentRepository');
const bookingRepository = require('../repositories/bookingRepository');
const bookingService = require('./bookingService');
const commissionService = require('./commissionService');
const notificationService = require('./notificationService');
const { createSSLCommerzInstance } = require('../config/sslcommerz');
const ApiError = require('../utils/ApiError');
const db = require('../config/database');
const { generateTransactionId } = require('../utils/transactionId');
const userRepository = require('../repositories/userRepository');
const vehicleRepository = require('../repositories/vehicleRepository');

class PaymentService {
  async initiatePayment(bookingId, userId) {
    console.log('🔍 Initiate payment:', { bookingId, userId });

    // ✅ Validate bookingId
    if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
      throw ApiError.badRequest('Invalid booking ID');
    }

    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    if (booking.customer_id !== userId) {
      throw ApiError.forbidden('You can only pay for your own bookings');
    }

    if (booking.status === 'expired') {
      throw ApiError.badRequest('Booking hold has expired. Please book again.');
    }

    if (booking.status !== 'pending_payment') {
      throw ApiError.badRequest(`Booking status is ${booking.status}, cannot initiate payment`);
    }

    if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
      await bookingRepository.updateStatus(bookingId, 'expired');
      throw ApiError.badRequest('Booking hold has expired. Please book again.');
    }

    const transactionId = generateTransactionId('UDRIVE');
    const bookingAmount = Number(booking.total_amount);

    console.log('💰 Payment amount:', bookingAmount);
    console.log('🔑 Transaction ID:', transactionId);

    const payment = await paymentRepository.create({
      bookingId,
      userId,
      amount: bookingAmount,
      transactionId,
      status: 'initiated',
    });

    const customerName = booking.customer_name || 'Customer';
    const customerEmail = booking.customer_email || 'customer@example.com';
    const customerPhone = booking.customer_phone || '01700000000';

    const paymentData = {
      total_amount: bookingAmount,
      currency: 'BDT',
      tran_id: transactionId,

      success_url:
        process.env.SSLC_SUCCESS_URL ||
        'http://192.168.0.224:5000/api/payments/success',

      fail_url:
        process.env.SSLC_FAIL_URL ||
        'http://192.168.0.224:5000/api/payments/fail',

      cancel_url:
        process.env.SSLC_CANCEL_URL ||
        'http://192.168.0.224:5000/api/payments/cancel',

      ipn_url:
        process.env.SSLC_IPN_URL ||
        'http://192.168.0.224:5000/api/payments/ipn',

      product_name: 'UDrive Car Rental',
      product_category: 'transportation',
      product_profile: 'general',

      shipping_method: 'NO',
      num_of_item: 1,

      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: customerPhone,

      ship_name: customerName,
      ship_add1: 'Dhaka',
      ship_city: 'Dhaka',
      ship_postcode: '1000',
      ship_country: 'Bangladesh',
    };

    console.log('📦 Payment Data:', JSON.stringify(paymentData, null, 2));

    try {
      const sslcommerz = createSSLCommerzInstance();

      console.log('🔍 Calling SSLCommerz...');
      const response = await sslcommerz.init(paymentData);

      console.log('📥 SSLCommerz Response:', JSON.stringify(response, null, 2));

      if (response.status === 'FAILED' || response.status === 'failed') {
        const errorMsg = response.failedreason || response.error || 'Payment initiation failed';
        await paymentRepository.updateStatus(payment.id, 'failed', { error: errorMsg });
        throw new Error(errorMsg);
      }

      const gatewayUrl = response.GatewayPageURL ||
        response.redirectGatewayURL ||
        response.gateway_url ||
        response.GatewayURL ||
        response.redirect_url;

      console.log('✅ Gateway URL:', gatewayUrl);

      if (!gatewayUrl) {
        console.error('❌ No gateway URL in response:', response);
        await paymentRepository.updateStatus(payment.id, 'failed', {
          error: 'No gateway URL received',
          response: response
        });
        throw new Error('Gateway URL not received from SSLCommerz');
      }

      await paymentRepository.updateStatus(payment.id, 'pending', {
        gateway_url: gatewayUrl,
        response: response
      });

      return {
        paymentId: payment.id,
        transactionId,
        gatewayUrl,
        amount: bookingAmount,
      };

    } catch (error) {
      console.error('❌ SSLCommerz Error:', error.message);

      await paymentRepository.updateStatus(payment.id, 'failed', {
        error: error.message
      });

      throw ApiError.badRequest('Payment initiation failed: ' + error.message);
    }
  }

  async handlePaymentSuccess(transactionId, valId) {
    return this.processPayment(transactionId, valId, 'success');
  }

  async handlePaymentIPN(transactionId, valId) {
    return this.processPayment(transactionId, valId, 'ipn');
  }

  async processPayment(transactionId, valId, source) {
    console.log(`🔍 Processing payment from ${source}:`, { transactionId, valId });

    const existingPayment = await paymentRepository.findByTransactionId(transactionId);

    if (!existingPayment) {
      throw ApiError.notFound('Payment not found');
    }

    // ✅ FIX: Add bookingId in already-processed case
    if (existingPayment.status === 'paid') {
      console.log('✅ Payment already processed (idempotent)');
      return {
        success: true,
        message: 'Payment already processed',
        paymentId: existingPayment.id,
        bookingId: existingPayment.booking_id, // ✅ ADDED
        bookingStatus: 'confirmed',
      };
    }

    const booking = await bookingRepository.findById(existingPayment.booking_id);

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    if (booking.status === 'expired') {
      throw ApiError.badRequest('Booking has expired');
    }

    if (booking.status !== 'pending_payment') {
      throw ApiError.badRequest(`Booking status is ${booking.status}, cannot process payment`);
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      console.log('🔍 Transaction started');

      await client.query(
        `UPDATE payments 
         SET status = 'paid', 
             validated_at = CURRENT_TIMESTAMP, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [existingPayment.id]
      );
      console.log('✅ Payment marked as paid');

      await client.query(
        `UPDATE bookings 
         SET status = 'confirmed', 
             hold_expires_at = NULL,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [booking.id]
      );
      console.log('✅ Booking confirmed');

      await client.query(
        `INSERT INTO wallet_transactions (
          user_id, booking_id, type, amount,
          transaction_type, description, reference_id
        )
        VALUES ($1, $2, 'debit', $3, 'booking_payment', $4, $5)`,
        [
          existingPayment.user_id,
          booking.id,
          Number(existingPayment.amount),
          `Payment for booking #${booking.id.slice(0, 8)}`,
          transactionId,
        ]
      );
      console.log('✅ Customer wallet debited');

      await commissionService.processCommissionSplit(client, booking, existingPayment);
      console.log('✅ Commission split completed');

      await client.query('COMMIT');
      console.log('✅ Transaction committed');

      // Send notifications
      try {
        const customer = await userRepository.findById(booking.customer_id);
        const vehicle = await vehicleRepository.findById(booking.vehicle_id);

        if (customer && vehicle) {
          await notificationService.bookingConfirmed(booking, customer, vehicle);
          await notificationService.paymentSuccess(existingPayment, booking, customer, vehicle);

          const owner = await userRepository.findById(vehicle.owner_id);
          if (owner) {
            await notificationService.ownerNewBooking(booking, customer, vehicle, owner);
            await notificationService.ownerPaymentReceived(booking, existingPayment, owner);
          }

          const adminResult = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
          if (adminResult.rows.length > 0) {
            await notificationService.adminNewBooking(booking, customer, vehicle, adminResult.rows[0]);
          }

          console.log('📢 All notifications sent');
        }
      } catch (notifError) {
        console.error('❌ Notification error:', notifError.message);
      }

      // ✅ Return bookingId
      return {
        success: true,
        message: 'Payment processed successfully',
        paymentId: existingPayment.id,
        bookingId: booking.id, // ✅ Already here
        bookingStatus: 'confirmed',
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async handlePaymentFail(transactionId) {
    console.log('🔍 Payment failed:', transactionId);

    const payment = await paymentRepository.findByTransactionId(transactionId);

    if (payment) {
      await paymentRepository.updateStatus(payment.id, 'failed');

      const booking = await bookingRepository.findById(payment.booking_id);
      if (booking && booking.status === 'pending_payment') {
        if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
          await bookingRepository.updateStatus(booking.id, 'expired');
        }

        try {
          const customer = await userRepository.findById(booking.customer_id);
          if (customer) {
            await notificationService.paymentFailed(payment, booking, customer);
            console.log('📢 Payment failed notification sent');
          }
        } catch (notifError) {
          console.error('❌ Notification error:', notifError.message);
        }
      }
    }

    return { success: false, message: 'Payment failed' };
  }

  async handlePaymentCancel(transactionId) {
    console.log('🔍 Payment cancelled:', transactionId);

    const payment = await paymentRepository.findByTransactionId(transactionId);

    if (payment) {
      await paymentRepository.updateStatus(payment.id, 'cancelled');

      const booking = await bookingRepository.findById(payment.booking_id);
      if (booking && booking.status === 'pending_payment') {
        if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
          await bookingRepository.updateStatus(booking.id, 'expired');
        }
      }
    }

    return { success: false, message: 'Payment cancelled' };
  }

  async getPaymentStatus(bookingId, userId) {
    const payments = await paymentRepository.findByBookingId(bookingId);

    if (payments.length === 0) {
      throw ApiError.notFound('No payments found for this booking');
    }

    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    const isCustomer = booking.customer_id === userId;
    const isOwner = booking.owner_id === userId;

    if (!isCustomer && !isOwner) {
      throw ApiError.forbidden('You do not have permission to view this payment');
    }

    return payments[0];
  }
}

module.exports = new PaymentService();
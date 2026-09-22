const db = require('../config/database');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // ✅ Email transporter setup with logging
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        console.log('📧 Email transporter initialized successfully');
      } catch (error) {
        console.error('❌ Email transporter failed:', error.message);
      }
    } else {
      console.warn('⚠️ Email credentials missing. Email notifications disabled.');
    }
  }

  // ============================================
  // ✅ CORE METHODS
  // ============================================

  async create(data) {
    const { userId, type, title, message, bookingId, vehicleId, paymentId, metadata } = data;

    // ✅ FIX: Validate userId
    if (!userId) {
      console.error('❌ Notification create failed: userId is required');
      return null;
    }

    try {
      const result = await db.query(
        `INSERT INTO notifications (
          user_id, type, title, message, booking_id, vehicle_id, payment_id, data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *`,
        [userId, type, title, message, bookingId || null, vehicleId || null, paymentId || null, JSON.stringify(metadata || {})]
      );

      console.log(`📢 Notification: ${type} → User ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Notification create error:', error.message);
      return null;
    }
  }

  async getByUser(userId, limit = 20, offset = 0) {
    const result = await db.query(
      `SELECT 
        n.id, n.user_id, n.type, n.title, n.message, n.data,
        n.is_read, n.read_at, n.created_at,
        n.booking_id, n.vehicle_id, n.payment_id,
        b.id as booking_id_ref
       FROM notifications n
       LEFT JOIN bookings b ON n.booking_id = b.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread
       FROM notifications WHERE user_id = $1`,
      [userId]
    );

    return {
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total || 0),
      unread: parseInt(countResult.rows[0].unread || 0),
    };
  }

  async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  async markAsRead(notificationId, userId) {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  async markAllAsRead(userId) {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND is_read = false
       RETURNING *`,
      [userId]
    );
    return result.rows;
  }

  async deleteById(notificationId, userId) {
    const result = await db.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  // ============================================
  // ✅ EMAIL SENDER (with error handling)
  // ============================================

  async sendEmail(to, subject, html) {
    if (!this.emailTransporter) {
      console.log('❌ Email transporter not configured');
      return false;
    }

    try {
      console.log(`📧 Sending email to ${to}...`);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'UDriveBD <noreply@udrivebd.com>',
        to,
        subject,
        html,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      if (error.code === 'EAUTH') {
        console.error('❌ Authentication failed. Check your email/password.');
      }
      return false;
    }
  }

  // ============================================
  // ✅ GET VEHICLE NAME (with fallback)
  // ============================================

  getVehicleName(vehicle) {
    if (!vehicle) return 'Vehicle';
    const brand = vehicle.brand || 'Vehicle';
    const model = vehicle.model || '';
    return model ? `${brand} ${model}` : brand;
  }

  // ============================================
  // ✅ ACCOUNT NOTIFICATIONS
  // ============================================

  // ✅ Account Created
  async accountCreated(user) {
    if (!user || !user.id) {
      console.error('❌ accountCreated: user is required');
      return null;
    }

    return this.create({
      userId: user.id,
      type: 'ACCOUNT_CREATED',
      title: '👋 Welcome to UDriveBD!',
      message: `Welcome ${user.name}! Please verify your email to get started.`,
      metadata: { userId: user.id },
    });
  }

  // ============================================
  // ✅ BOOKING NOTIFICATIONS
  // ============================================

  // 1. Booking Created
  async bookingCreated(booking, customer, vehicle) {
    if (!customer || !customer.id) {
      console.error('❌ bookingCreated: customer is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: customer.id,
      type: 'BOOKING_CREATED',
      title: '📝 Booking Created',
      message: `Your booking for ${vehicleName} is awaiting payment.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
      metadata: { pickupDate: booking.pickup_date, returnDate: booking.return_date },
    });
  }

  // 2. Booking Confirmed (with Email)
  async bookingConfirmed(booking, customer, vehicle) {
    if (!customer || !customer.id) {
      console.error('❌ bookingConfirmed: customer is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    await this.create({
      userId: customer.id,
      type: 'BOOKING_CONFIRMED',
      title: '✅ Booking Confirmed',
      message: `Your booking for ${vehicleName} has been confirmed.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
      metadata: { pickupDate: booking.pickup_date, returnDate: booking.return_date },
    });

    // ✅ Send Email
    await this.sendEmail(
      customer.email,
      'Booking Confirmed - UDriveBD',
      this.bookingConfirmedEmailTemplate(booking, customer, vehicle)
    );

    return true;
  }

  // 3. Payment Success (with Email)
  async paymentSuccess(payment, booking, customer, vehicle) {
    if (!customer || !customer.id) {
      console.error('❌ paymentSuccess: customer is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    await this.create({
      userId: customer.id,
      type: 'PAYMENT_SUCCESS',
      title: '💳 Payment Successful',
      message: `Payment of ৳${Number(payment.amount).toLocaleString()} for ${vehicleName} was successful.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
      paymentId: payment.id,
      metadata: { amount: payment.amount, transactionId: payment.transaction_id },
    });

    // ✅ Send Email Receipt
    await this.sendEmail(
      customer.email,
      'Payment Receipt - UDriveBD',
      this.paymentReceiptEmailTemplate(payment, booking, customer, vehicle)
    );

    return true;
  }

  // 4. Payment Failed (with Email)
  async paymentFailed(payment, booking, customer) {
    if (!customer || !customer.id) {
      console.error('❌ paymentFailed: customer is required');
      return null;
    }

    await this.create({
      userId: customer.id,
      type: 'PAYMENT_FAILED',
      title: '⚠️ Payment Failed',
      message: `Your payment of ৳${Number(payment.amount).toLocaleString()} could not be completed. You can retry while hold is active.`,
      bookingId: booking.id,
      paymentId: payment.id,
      metadata: { amount: payment.amount },
    });

    // ✅ Send Email
    await this.sendEmail(
      customer.email,
      'Payment Failed - UDriveBD',
      this.paymentFailedEmailTemplate(payment, booking, customer)
    );

    return true;
  }

  // 5. Booking Cancelled
  async bookingCancelled(booking, customer, vehicle) {
    if (!customer || !customer.id) {
      console.error('❌ bookingCancelled: customer is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: customer.id,
      type: 'BOOKING_CANCELLED',
      title: '❌ Booking Cancelled',
      message: `Your booking for ${vehicleName} has been cancelled.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
      metadata: { cancelReason: booking.cancel_reason },
    });
  }

  // 6. Refund Processed
  async refundProcessed(booking, customer, amount) {
    if (!customer || !customer.id) {
      console.error('❌ refundProcessed: customer is required');
      return null;
    }

    return this.create({
      userId: customer.id,
      type: 'REFUND_PROCESSED',
      title: '🔄 Refund Processed',
      message: `Your refund of ৳${Number(amount).toLocaleString()} has been processed.`,
      bookingId: booking.id,
      metadata: { amount },
    });
  }

  // 7. Booking Hold Expired
  async bookingHoldExpired(booking, customer, vehicle) {
    if (!customer || !customer.id) {
      console.error('❌ bookingHoldExpired: customer is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: customer.id,
      type: 'BOOKING_EXPIRED',
      title: '⏰ Booking Expired',
      message: `Your booking hold for ${vehicleName} has expired.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
    });
  }

  // ============================================
  // ✅ OWNER NOTIFICATIONS
  // ============================================

  // 8. Owner: New Booking (with Email)
  async ownerNewBooking(booking, customer, vehicle, owner) {
    if (!owner || !owner.id) {
      console.error('❌ ownerNewBooking: owner is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    await this.create({
      userId: owner.id,
      type: 'OWNER_NEW_BOOKING',
      title: '🚗 New Booking Received',
      message: `You have received a new booking request for ${vehicleName}.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
      metadata: {
        customerName: customer.name,
        customerEmail: customer.email,
        pickupDate: booking.pickup_date,
        returnDate: booking.return_date,
        bookingAmount: booking.total_amount,
      },
    });

    // ✅ Send Email to Owner
    await this.sendEmail(
      owner.email,
      'New Booking - UDriveBD',
      this.ownerNewBookingEmailTemplate(booking, customer, vehicle, owner)
    );

    return true;
  }

  // 9. Owner: Payment Received
  async ownerPaymentReceived(booking, payment, owner) {
    if (!owner || !owner.id) {
      console.error('❌ ownerPaymentReceived: owner is required');
      return null;
    }

    return this.create({
      userId: owner.id,
      type: 'OWNER_PAYMENT_RECEIVED',
      title: '💰 Payment Received',
      message: `Payment for booking #${booking.id.slice(0, 8)} has been successfully received.`,
      bookingId: booking.id,
      paymentId: payment.id,
      metadata: {
        amount: payment.amount,
        transactionId: payment.transaction_id,
        platformCommission: payment.amount * 0.15,
        ownerEarning: payment.amount * 0.85,
      },
    });
  }

  // ============================================
  // ✅ ADMIN NOTIFICATIONS
  // ============================================

  // 10. Admin: New Booking
  async adminNewBooking(booking, customer, vehicle, admin) {
    if (!admin || !admin.id) {
      console.error('❌ adminNewBooking: admin is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: admin.id,
      type: 'ADMIN_NEW_BOOKING',
      title: '📊 New Booking Alert',
      message: `A new booking has been created for ${vehicleName}.`,
      bookingId: booking.id,
      vehicleId: vehicle?.id || null,
      metadata: {
        customerName: customer.name,
        customerEmail: customer.email,
        pickupDate: booking.pickup_date,
        returnDate: booking.return_date,
        bookingAmount: booking.total_amount,
      },
    });
  }

  // 11. Admin: KYC Review
  async adminKycReview(user, admin) {
    if (!admin || !admin.id) {
      console.error('❌ adminKycReview: admin is required');
      return null;
    }

    return this.create({
      userId: admin.id,
      type: 'ADMIN_KYC_REVIEW',
      title: '📋 New KYC Submission',
      message: `${user.name} (${user.email}) has submitted KYC documents for review.`,
      metadata: {
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        submittedAt: new Date().toISOString(),
      },
    });
  }

  // 12. Admin: Document Review
  async adminDocumentReview(documentType, vehicle, owner, admin) {
    if (!admin || !admin.id) {
      console.error('❌ adminDocumentReview: admin is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: admin.id,
      type: 'ADMIN_DOCUMENT_REVIEW',
      title: '📋 Vehicle Documents Awaiting Review',
      message: `Vehicle documents for ${vehicleName} (${documentType}) require verification.`,
      vehicleId: vehicle?.id || null,
      metadata: {
        documentType: documentType,
        ownerName: owner.name,
        ownerEmail: owner.email,
      },
    });
  }

  // ============================================
  // ✅ KYC NOTIFICATIONS
  // ============================================

  // 13. KYC Approved
  async kycApproved(user) {
    if (!user || !user.id) {
      console.error('❌ kycApproved: user is required');
      return null;
    }

    return this.create({
      userId: user.id,
      type: 'KYC_APPROVED',
      title: '✅ KYC Approved',
      message: `Your identity verification has been approved.`,
      metadata: { role: user.role },
    });
  }

  // 14. KYC Rejected
  async kycRejected(user, reason) {
    if (!user || !user.id) {
      console.error('❌ kycRejected: user is required');
      return null;
    }

    return this.create({
      userId: user.id,
      type: 'KYC_REJECTED',
      title: '❌ KYC Rejected',
      message: `Your KYC verification was rejected. Please review and resubmit.`,
      metadata: { reason },
    });
  }

  // ============================================
  // ✅ VEHICLE DOCUMENT NOTIFICATIONS
  // ============================================

  // 15. Vehicle Document Approved
  async vehicleDocumentApproved(owner, documentType, vehicle) {
    if (!owner || !owner.id) {
      console.error('❌ vehicleDocumentApproved: owner is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: owner.id,
      type: 'VEHICLE_DOCUMENT_APPROVED',
      title: '✅ Document Approved',
      message: `Your ${documentType.replace('_', ' ')} for ${vehicleName} has been approved.`,
      vehicleId: vehicle?.id || null,
      metadata: { documentType },
    });
  }

  // 16. Vehicle Document Rejected
  async vehicleDocumentRejected(owner, documentType, vehicle, reason) {
    if (!owner || !owner.id) {
      console.error('❌ vehicleDocumentRejected: owner is required');
      return null;
    }

    const vehicleName = this.getVehicleName(vehicle);

    return this.create({
      userId: owner.id,
      type: 'VEHICLE_DOCUMENT_REJECTED',
      title: '❌ Document Rejected',
      message: `Your ${documentType.replace('_', ' ')} for ${vehicleName} was rejected.`,
      vehicleId: vehicle?.id || null,
      metadata: { documentType, reason },
    });
  }

  // ============================================
  // ✅ EMAIL TEMPLATES
  // ============================================

  bookingConfirmedEmailTemplate(booking, customer, vehicle) {
    const vehicleName = this.getVehicleName(vehicle);

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Booking Confirmed</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#1a202c;">🚗 Booking Confirmed!</h1>
          <p>Dear <strong>${customer.name}</strong>,</p>
          <p>Your booking for <strong>${vehicleName}</strong> has been confirmed.</p>
          <div style="background:#f7fafc;padding:15px;border-radius:8px;margin:15px 0;">
            <p><strong>Booking ID:</strong> ${booking.id.slice(0, 8)}</p>
            <p><strong>Pickup:</strong> ${new Date(booking.pickup_date).toLocaleDateString()}</p>
            <p><strong>Return:</strong> ${new Date(booking.return_date).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ৳${Number(booking.total_amount).toLocaleString()}</p>
          </div>
          <p><a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" style="background:#3182ce;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Booking</a></p>
          <p style="color:#718096;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} UDriveBD</p>
        </div>
      </body>
      </html>
    `;
  }

  paymentReceiptEmailTemplate(payment, booking, customer, vehicle) {
    const vehicleName = this.getVehicleName(vehicle);

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Payment Receipt</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#1a202c;">💳 Payment Receipt</h1>
          <p>Dear <strong>${customer.name}</strong>,</p>
          <p>Your payment of <strong>৳${Number(payment.amount).toLocaleString()}</strong> for <strong>${vehicleName}</strong> has been received.</p>
          <div style="background:#f7fafc;padding:15px;border-radius:8px;margin:15px 0;">
            <p><strong>Transaction ID:</strong> ${payment.transaction_id}</p>
            <p><strong>Booking ID:</strong> ${booking.id.slice(0, 8)}</p>
            <p><strong>Amount:</strong> ৳${Number(payment.amount).toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p><a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" style="background:#3182ce;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Booking</a></p>
          <p style="color:#718096;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} UDriveBD</p>
        </div>
      </body>
      </html>
    `;
  }

  paymentFailedEmailTemplate(payment, booking, customer) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Payment Failed</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#e53e3e;">⚠️ Payment Failed</h1>
          <p>Dear <strong>${customer.name}</strong>,</p>
          <p>Your payment of <strong>৳${Number(payment.amount).toLocaleString()}</strong> failed.</p>
          <p>Please try again or use a different payment method.</p>
          <p><a href="${process.env.FRONTEND_URL}/booking/payment?booking_id=${booking.id}" style="background:#3182ce;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Retry Payment</a></p>
          <p style="color:#718096;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} UDriveBD</p>
        </div>
      </body>
      </html>
    `;
  }

  ownerNewBookingEmailTemplate(booking, customer, vehicle, owner) {
    const vehicleName = this.getVehicleName(vehicle);

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>New Booking</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#1a202c;">🚗 New Booking Received!</h1>
          <p>Dear <strong>${owner.name}</strong>,</p>
          <p><strong>${customer.name}</strong> has booked your <strong>${vehicleName}</strong>.</p>
          <div style="background:#f7fafc;padding:15px;border-radius:8px;margin:15px 0;">
            <p><strong>Booking ID:</strong> ${booking.id.slice(0, 8)}</p>
            <p><strong>Pickup:</strong> ${new Date(booking.pickup_date).toLocaleDateString()}</p>
            <p><strong>Return:</strong> ${new Date(booking.return_date).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ৳${Number(booking.total_amount).toLocaleString()}</p>
            <p><strong>Your Earnings:</strong> ৳${Number(booking.total_amount * 0.85).toLocaleString()}</p>
          </div>
          <p><a href="${process.env.FRONTEND_URL}/owner/bookings/${booking.id}" style="background:#3182ce;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Booking</a></p>
          <p style="color:#718096;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} UDriveBD</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new NotificationService();
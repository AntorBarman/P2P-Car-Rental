const express = require('express');

const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/auth');
const {
  validateInitiatePayment,
} = require('../validators/paymentValidator');

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const db = require('../config/database');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PROTECTED PAYMENT ROUTES
|--------------------------------------------------------------------------
*/

// Initiate payment
router.post(
  '/initiate',
  authMiddleware,
  validateInitiatePayment,
  paymentController.initiatePayment
);

// Get payment status
router.get(
  '/status/:bookingId',
  authMiddleware,
  paymentController.getPaymentStatus
);

// Get my payments
router.get(
  '/my',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await db.query(
      `
      SELECT 
        p.*,
        b.id AS booking_id,
        b.status AS booking_status,
        v.brand,
        v.model
      FROM payments p
      JOIN bookings b 
        ON p.booking_id = b.id
      JOIN vehicles v 
        ON b.vehicle_id = v.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );

    res.json(
      ApiResponse.ok(
        'Payments retrieved',
        result.rows
      )
    );
  })
);


/*
|--------------------------------------------------------------------------
| SSL COMMERZ CALLBACK ROUTES
|
| IMPORTANT:
| These routes MUST NOT use authMiddleware.
|--------------------------------------------------------------------------
*/

// SUCCESS
router.post(
  '/success',
  paymentController.paymentSuccess
);

// FAIL
router.post(
  '/fail',
  paymentController.paymentFail
);

// CANCEL
router.post(
  '/cancel',
  paymentController.paymentCancel
);

// IPN
router.post(
  '/ipn',
  paymentController.paymentIPN
);

module.exports = router;
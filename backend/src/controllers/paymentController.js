// backend/src/controllers/paymentController.js

const paymentService = require('../services/paymentService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/*
|--------------------------------------------------------------------------
| INITIATE PAYMENT
|--------------------------------------------------------------------------
*/

const initiatePayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user.id;

  console.log('🔍 Initiate payment:', { bookingId, userId });

  // ✅ Validate bookingId
  if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID'
    });
  }

  const result = await paymentService.initiatePayment(bookingId, userId);

  res.status(200).json(
    ApiResponse.ok('Payment initiated', result)
  );
});

/*
|--------------------------------------------------------------------------
| SUCCESS
|--------------------------------------------------------------------------
*/

const paymentSuccess = asyncHandler(async (req, res) => {
  console.log('======================================');
  console.log('💰 SSLCommerz SUCCESS CALLBACK');
  console.log('======================================');
  console.log('Body:', req.body);

  const { tran_id, val_id, status } = req.body;

  const frontendUrl = process.env.FRONTEND_URL || 'http://192.168.0.224:5173';

  if (!tran_id) {
    console.error('❌ Success callback missing tran_id');
    return res.redirect(`${frontendUrl}/payment/failed?reason=Missing transaction ID`);
  }

  try {
    const result = await paymentService.handlePaymentSuccess(tran_id, val_id);
    
    console.log('✅ Payment processed:', result);
    
    // ✅ Extract booking ID safely
    const bookingId = result?.bookingId || result?.booking_id || '';
    
    console.log('✅ Booking ID for redirect:', bookingId);
    
    // Build redirect URL
    let redirectUrl = `${frontendUrl}/payment/success?tran_id=${encodeURIComponent(tran_id)}`;
    
    if (bookingId) {
      redirectUrl += `&booking_id=${encodeURIComponent(bookingId)}`;
    }
    
    console.log('✅ Redirecting to:', redirectUrl);
    
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Success callback error:', error.message);
    return res.redirect(`${frontendUrl}/payment/failed?reason=${encodeURIComponent(error.message)}`);
  }
});

/*
|--------------------------------------------------------------------------
| FAIL
|--------------------------------------------------------------------------
*/

const paymentFail = asyncHandler(async (req, res) => {
  console.log('======================================');
  console.log('❌ SSLCommerz PAYMENT FAILED');
  console.log('======================================');
  console.log('Body:', req.body);

  const { tran_id } = req.body;
  const frontendUrl = process.env.FRONTEND_URL || 'http://192.168.0.224:5173';

  try {
    if (tran_id) {
      await paymentService.handlePaymentFail(tran_id);
    }

    const redirectUrl = `${frontendUrl}/payment/failed?tran_id=${encodeURIComponent(tran_id || '')}&reason=${encodeURIComponent('Payment failed. You can try again.')}`;
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Payment fail callback error:', error.message);
    return res.redirect(`${frontendUrl}/payment/failed?reason=${encodeURIComponent(error.message)}`);
  }
});

/*
|--------------------------------------------------------------------------
| CANCEL
|--------------------------------------------------------------------------
*/

const paymentCancel = asyncHandler(async (req, res) => {
  console.log('======================================');
  console.log('⚠️ SSLCommerz PAYMENT CANCELLED');
  console.log('======================================');
  console.log('Body:', req.body);

  const { tran_id } = req.body;
  const frontendUrl = process.env.FRONTEND_URL || 'http://192.168.0.224:5173';

  try {
    if (tran_id) {
      await paymentService.handlePaymentCancel(tran_id);
    }

    const redirectUrl = `${frontendUrl}/payment/failed?tran_id=${encodeURIComponent(tran_id || '')}&reason=${encodeURIComponent('Payment cancelled. You can try again.')}`;
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Payment cancel callback error:', error.message);
    return res.redirect(`${frontendUrl}/payment/failed?reason=${encodeURIComponent(error.message)}`);
  }
});

/*
|--------------------------------------------------------------------------
| IPN
|--------------------------------------------------------------------------
*/

const paymentIPN = asyncHandler(async (req, res) => {
  console.log('======================================');
  console.log('📡 SSLCommerz IPN');
  console.log('======================================');
  console.log('Body:', req.body);

  const { tran_id, val_id } = req.body;

  try {
    if (!tran_id) {
      return res.status(200).json({
        success: false,
        message: 'Missing transaction ID',
      });
    }

    const result = await paymentService.handlePaymentIPN(tran_id, val_id);
    console.log('✅ IPN processed:', result);

    return res.status(200).json({
      success: true,
      message: 'IPN processed',
      data: result,
    });

  } catch (error) {
    console.error('❌ IPN processing error:', error.message);
    return res.status(200).json({
      success: false,
      message: 'IPN received',
    });
  }
});

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

const getPaymentStatus = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentStatus(
    req.params.bookingId,
    req.user.id
  );

  res.status(200).json(
    ApiResponse.ok('Payment status retrieved', payment)
  );
});

module.exports = {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN,
  getPaymentStatus,
};
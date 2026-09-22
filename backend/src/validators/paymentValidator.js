const Joi = require('joi');

// ✅ Updated: Accept bookingId (camelCase) instead of booking_id
const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.empty': 'Booking ID is required',
      'string.guid': 'Invalid booking ID format',
      'any.required': 'Booking ID is required',
    }),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      console.log('❌ Validation errors:', errors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validateInitiatePayment: validate(initiatePaymentSchema),
};
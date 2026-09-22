const Joi = require('joi');

// ✅ Create booking validation
const validateCreateBooking = (req, res, next) => {
  const schema = Joi.object({
    vehicleId: Joi.string().uuid().required().messages({
      'string.base': 'Vehicle ID must be a string',
      'string.uuid': 'Vehicle ID must be a valid UUID',
      'any.required': 'Vehicle ID is required',
    }),
    pickupDate: Joi.date().iso().required().messages({
      'date.base': 'Pickup date must be a valid date',
      'date.iso': 'Pickup date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Pickup date is required',
    }),
    returnDate: Joi.date().iso().greater(Joi.ref('pickupDate')).required().messages({
      'date.base': 'Return date must be a valid date',
      'date.iso': 'Return date must be in ISO format (YYYY-MM-DD)',
      'date.greater': 'Return date must be after pickup date',
      'any.required': 'Return date is required',
    }),
    pickupTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('10:00'),
    returnTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('10:00'),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));

    console.log('❌ Validation errors:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  // ✅ Set defaults if not provided
  req.body = value;
  next();
};

// ✅ Update booking status validation
const validateUpdateStatus = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid(
      'pending_payment', 
      'confirmed', 
      'ongoing', 
      'completed', 
      'cancelled', 
      'expired'
    ).required().messages({
      'any.required': 'Status is required',
      'any.only': 'Invalid status value',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

module.exports = {
  validateCreateBooking,
  validateUpdateStatus,
};
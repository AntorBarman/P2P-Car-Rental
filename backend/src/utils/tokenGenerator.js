const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id, // IMPORTANT
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const generateTokenHash = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenHash,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyAccessToken,
};
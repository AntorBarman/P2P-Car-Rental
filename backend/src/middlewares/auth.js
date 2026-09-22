const { verifyAccessToken } = require('../utils/tokenGenerator');
const ApiError = require('../utils/ApiError');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token not provided');
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyAccessToken(token);

    console.log('🔐 JWT decoded:', decoded);

    if (!decoded.userId) {
      throw ApiError.unauthorized('Invalid token: userId missing');
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };

    console.log('👤 Authenticated user:', req.user);

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Access token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid access token'));
    } else {
      next(error);
    }
  }
};

module.exports = authMiddleware;
const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(ApiResponse.created('Registration successful', result));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const result = await authService.verifyEmail(token);
  res.json(ApiResponse.ok('Email verified successfully', result));
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendVerificationEmail(email);
  res.json(ApiResponse.ok('Verification email sent', result));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  const result = await authService.login(email, password, ipAddress, userAgent);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json(ApiResponse.ok('Login successful', {
    user: result.user,
    accessToken: result.accessToken,
  }));
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  const result = await authService.refreshToken(refreshToken, ipAddress, userAgent);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json(ApiResponse.ok('Token refreshed', {
    accessToken: result.accessToken,
  }));
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  await authService.logout(refreshToken);

  res.clearCookie('refreshToken');
  res.json(ApiResponse.ok('Logout successful'));
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
};
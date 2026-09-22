const bcrypt = require('bcrypt');

const userRepository = require('../repositories/userRepository');
const tokenRepository = require('../repositories/tokenRepository');
const db = require('../config/database');

const {
  generateAccessToken,
  generateRefreshToken,
  generateTokenHash,
  generateEmailVerificationToken,
} = require('../utils/tokenGenerator');

const ApiError = require('../utils/ApiError');
const emailService = require('./emailService');
const notificationService = require('./notificationService');


class AuthService {

  // ============================================================
  // HELPER: GET FRONTEND URL
  // ============================================================

  getFrontendUrl() {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error(
        'FRONTEND_URL is not configured in backend .env'
      );
    }

    // Remove trailing slash
    return frontendUrl.replace(/\/+$/, '');
  }


  // ============================================================
  // REGISTER
  // ============================================================

  async register(userData) {

    // ----------------------------------------------------------
    // 1. Check existing email
    // ----------------------------------------------------------

    const existingEmail = await userRepository.findByEmail(
      userData.email
    );

    if (existingEmail) {
      throw ApiError.conflict('Email already registered');
    }


    // ----------------------------------------------------------
    // 2. Check existing phone
    // ----------------------------------------------------------

    const existingPhone = await userRepository.findByPhone(
      userData.phone
    );

    if (existingPhone) {
      throw ApiError.conflict('Phone number already registered');
    }


    // ----------------------------------------------------------
    // 3. Hash password
    // ----------------------------------------------------------

    const passwordHash = await bcrypt.hash(
      userData.password,
      10
    );


    // ----------------------------------------------------------
    // 4. Create user
    // ----------------------------------------------------------

    const user = await userRepository.create({
      ...userData,
      passwordHash,
      email_verified: false,
    });


    // ----------------------------------------------------------
    // 5. Generate email verification token
    // ----------------------------------------------------------

    const verificationToken =
      generateEmailVerificationToken();


    // Token expires after 24 hours
    const expiresAt = new Date();

    expiresAt.setHours(
      expiresAt.getHours() + 24
    );


    // ----------------------------------------------------------
    // 6. Save verification token
    // ----------------------------------------------------------

    await db.query(
      `
      INSERT INTO email_verification_tokens
      (
        user_id,
        token,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [
        user.id,
        verificationToken,
        expiresAt
      ]
    );


    // ==========================================================
    // 7. SEND VERIFICATION EMAIL
    // ==========================================================

    try {

      const frontendUrl = this.getFrontendUrl();

      const verificationLink =
        `${frontendUrl}/verify-email?token=${encodeURIComponent(
          verificationToken
        )}`;


      // --------------------------------------------------------
      // DEBUG LOG
      // --------------------------------------------------------

      console.log('');
      console.log('==============================================');
      console.log('📧 EMAIL VERIFICATION');
      console.log('==============================================');
      console.log(
        '🌐 FRONTEND_URL:',
        process.env.FRONTEND_URL
      );
      console.log(
        '🌐 Normalized URL:',
        frontendUrl
      );
      console.log(
        '🔑 Verification Token:',
        verificationToken
      );
      console.log(
        '🔗 Verification Link:',
        verificationLink
      );
      console.log('==============================================');
      console.log('');


      const emailHtml =
        emailService.getVerificationEmailTemplate(
          user.name,
          verificationLink
        );


      await emailService.sendEmail(
        user.email,
        'Verify Your Email - UDriveBD',
        emailHtml
      );


      console.log(
        `✅ Verification email sent to ${user.email}`
      );

    } catch (emailError) {

      console.error(
        '❌ Email sending failed:',
        emailError.message
      );

      // Don't delete user.
      // User can use resend verification later.
    }


    // ==========================================================
    // 8. CREATE IN-APP NOTIFICATION
    // ==========================================================

    try {

      /*
       * IMPORTANT:
       *
       * Your previous code was:
       *
       * notificationService.create(
       *   user.id,
       *   'ACCOUNT_CREATED',
       *   ...
       * )
       *
       * But your log says:
       *
       * "userId is required"
       *
       * Therefore your notificationService.create()
       * most likely expects an object.
       */

      await notificationService.create({
        userId: user.id,
        type: 'ACCOUNT_CREATED',
        title: '👋 Welcome to UDriveBD!',
        message:
          `Welcome ${user.name}! Please verify your email to get started.`,
        data: {
          userId: user.id,
        },
      });


      console.log(
        `🔔 Welcome notification created for ${user.email}`
      );

    } catch (notifError) {

      console.error(
        '❌ Notification create failed:',
        notifError.message
      );
    }


    // ----------------------------------------------------------
    // 9. Return registration response
    // ----------------------------------------------------------

    return {

      id: user.id,

      name: user.name,

      email: user.email,

      phone: user.phone,

      role: user.role,

      email_verified: false,

      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }


  // ============================================================
  // VERIFY EMAIL
  // ============================================================

  async verifyEmail(token) {

    console.log(
      '🔍 Verifying email with token:',
      token
    );


    // ----------------------------------------------------------
    // Validate token
    // ----------------------------------------------------------

    if (!token) {

      throw ApiError.badRequest(
        'Verification token is required'
      );
    }


    // ----------------------------------------------------------
    // Find token
    // ----------------------------------------------------------

    const result = await db.query(
      `
      SELECT *
      FROM email_verification_tokens
      WHERE token = $1
      AND is_used = false
      `,
      [token]
    );


    if (result.rows.length === 0) {

      throw ApiError.badRequest(
        'Invalid or expired verification token'
      );
    }


    const tokenData = result.rows[0];


    console.log(
      '✅ Token found:',
      tokenData.id
    );


    // ----------------------------------------------------------
    // Check expiry
    // ----------------------------------------------------------

    if (
      new Date(tokenData.expires_at) < new Date()
    ) {

      await db.query(
        `
        DELETE FROM email_verification_tokens
        WHERE id = $1
        `,
        [tokenData.id]
      );


      throw ApiError.badRequest(
        'Verification token has expired. Please request a new one.'
      );
    }


    // ----------------------------------------------------------
    // Update user + token
    // ----------------------------------------------------------

    /*
     * We update the user first.
     * Only after successful user update do we mark token used.
     */

    const updateResult = await db.query(
      `
      UPDATE users
      SET
        email_verified = true,
        email_verified_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [tokenData.user_id]
    );


    if (updateResult.rows.length === 0) {

      throw ApiError.notFound(
        'User not found'
      );
    }


    const user = updateResult.rows[0];


    // ----------------------------------------------------------
    // Mark token as used
    // ----------------------------------------------------------

    await db.query(
      `
      UPDATE email_verification_tokens
      SET is_used = true
      WHERE id = $1
      `,
      [tokenData.id]
    );


    console.log(
      '✅ Email verified:',
      user.email
    );

    console.log(
      '✅ email_verified:',
      user.email_verified
    );


    // ----------------------------------------------------------
    // Send welcome email
    // ----------------------------------------------------------

    try {

      const welcomeHtml =
        emailService.getEmailVerifiedTemplate(
          user.name
        );


      await emailService.sendEmail(
        user.email,
        'Email Verified - UDriveBD',
        welcomeHtml
      );

    } catch (emailError) {

      console.error(
        '❌ Welcome email failed:',
        emailError.message
      );
    }


    // ----------------------------------------------------------
    // Create verification notification
    // ----------------------------------------------------------

    try {

      await notificationService.create({
        userId: user.id,
        type: 'EMAIL_VERIFIED',
        title: '✅ Email Verified',
        message:
          'Your email has been successfully verified. You can now use UDriveBD.',
        data: {
          userId: user.id,
        },
      });

    } catch (notifError) {

      console.error(
        '❌ Verification notification failed:',
        notifError.message
      );
    }


    // ----------------------------------------------------------
    // Return
    // ----------------------------------------------------------

    return {

      success: true,

      message:
        'Email verified successfully!',

      user: {

        id: user.id,

        name: user.name,

        email: user.email,

        email_verified:
          user.email_verified,
      },
    };
  }


  // ============================================================
  // RESEND VERIFICATION EMAIL
  // ============================================================

  async resendVerificationEmail(email) {

    // ----------------------------------------------------------
    // Find user
    // ----------------------------------------------------------

    const user =
      await userRepository.findByEmail(email);


    if (!user) {

      throw ApiError.notFound(
        'User not found'
      );
    }


    // ----------------------------------------------------------
    // Already verified
    // ----------------------------------------------------------

    if (user.email_verified) {

      throw ApiError.badRequest(
        'Email already verified'
      );
    }


    // ----------------------------------------------------------
    // Delete previous unused tokens
    // ----------------------------------------------------------

    await db.query(
      `
      DELETE FROM email_verification_tokens
      WHERE user_id = $1
      AND is_used = false
      `,
      [user.id]
    );


    // ----------------------------------------------------------
    // Generate new token
    // ----------------------------------------------------------

    const verificationToken =
      generateEmailVerificationToken();


    const expiresAt = new Date();

    expiresAt.setHours(
      expiresAt.getHours() + 24
    );


    // ----------------------------------------------------------
    // Save new token
    // ----------------------------------------------------------

    await db.query(
      `
      INSERT INTO email_verification_tokens
      (
        user_id,
        token,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [
        user.id,
        verificationToken,
        expiresAt
      ]
    );


    // ==========================================================
    // SEND NEW EMAIL
    // ==========================================================

    try {

      const frontendUrl =
        this.getFrontendUrl();


      const verificationLink =
        `${frontendUrl}/verify-email?token=${encodeURIComponent(
          verificationToken
        )}`;


      // --------------------------------------------------------
      // DEBUG
      // --------------------------------------------------------

      console.log('');
      console.log('==============================================');
      console.log('📧 RESEND VERIFICATION EMAIL');
      console.log('==============================================');
      console.log(
        '🌐 FRONTEND_URL:',
        process.env.FRONTEND_URL
      );
      console.log(
        '🌐 Normalized URL:',
        frontendUrl
      );
      console.log(
        '🔗 Verification Link:',
        verificationLink
      );
      console.log('==============================================');
      console.log('');


      const emailHtml =
        emailService.getVerificationEmailTemplate(
          user.name,
          verificationLink
        );


      const sent =
        await emailService.sendEmail(
          user.email,
          'Verify Your Email - UDriveBD',
          emailHtml
        );


      if (!sent) {

        throw new Error(
          'Email service failed to send verification email'
        );
      }


      console.log(
        `✅ New verification email sent to ${user.email}`
      );

    } catch (emailError) {

      console.error(
        '❌ Email failed:',
        emailError.message
      );

      throw ApiError.internal(
        'Failed to send verification email'
      );
    }


    return {

      success: true,

      message:
        'Verification email sent successfully. Please check your inbox.',
    };
  }


  // ============================================================
  // LOGIN
  // ============================================================

  async login(
    email,
    password,
    ipAddress,
    userAgent
  ) {

    const user =
      await userRepository.findByEmail(email);


    if (!user) {

      throw ApiError.unauthorized(
        'Invalid email or password'
      );
    }


    // ----------------------------------------------------------
    // Active account
    // ----------------------------------------------------------

    if (!user.is_active) {

      throw ApiError.forbidden(
        'Account is deactivated'
      );
    }


    // ----------------------------------------------------------
    // Email verification
    // ----------------------------------------------------------

    if (
      !user.email_verified &&
      user.role !== 'admin'
    ) {

      throw ApiError.forbidden(
        'Please verify your email before logging in. Check your inbox for the verification link.'
      );
    }


    // ----------------------------------------------------------
    // Password
    // ----------------------------------------------------------

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password_hash
      );


    if (!isPasswordValid) {

      throw ApiError.unauthorized(
        'Invalid email or password'
      );
    }


    // ----------------------------------------------------------
    // Generate access token
    // ----------------------------------------------------------

    const accessToken =
      generateAccessToken(user);


    // ----------------------------------------------------------
    // Generate refresh token
    // ----------------------------------------------------------

    const refreshToken =
      generateRefreshToken();


    const tokenHash =
      generateTokenHash(refreshToken);


    // ----------------------------------------------------------
    // Refresh token expiry
    // ----------------------------------------------------------

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );


    // ----------------------------------------------------------
    // Save refresh token
    // ----------------------------------------------------------

    await tokenRepository.create(
      user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    );


    // ----------------------------------------------------------
    // Update last login
    // ----------------------------------------------------------

    await userRepository.updateLastLogin(
      user.id
    );


    // ----------------------------------------------------------
    // Return
    // ----------------------------------------------------------

    return {

      user: {

        id: user.id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,

        avatar_url: user.avatar_url,

        email_verified:
          user.email_verified,

        is_active:
          user.is_active,

        created_at:
          user.created_at,
      },

      accessToken,

      refreshToken,
    };
  }


  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refreshToken(
    refreshToken,
    ipAddress,
    userAgent
  ) {

    if (!refreshToken) {

      throw ApiError.unauthorized(
        'Refresh token not provided'
      );
    }


    const tokenHash =
      generateTokenHash(refreshToken);


    const storedToken =
      await tokenRepository.findByTokenHash(
        tokenHash
      );


    if (!storedToken) {

      throw ApiError.unauthorized(
        'Invalid refresh token'
      );
    }


    if (storedToken.is_revoked) {

      await tokenRepository.revokeAllForUser(
        storedToken.user_id
      );

      throw ApiError.unauthorized(
        'Refresh token has been revoked'
      );
    }


    if (
      new Date(storedToken.expires_at) <
      new Date()
    ) {

      throw ApiError.unauthorized(
        'Refresh token expired'
      );
    }


    const user =
      await userRepository.findById(
        storedToken.user_id
      );


    if (
      !user ||
      !user.is_active
    ) {

      throw ApiError.unauthorized(
        'User not found or inactive'
      );
    }


    // Revoke old refresh token
    await tokenRepository.revoke(
      storedToken.id
    );


    // Generate new access token
    const accessToken =
      generateAccessToken(user);


    // Generate new refresh token
    const newRefreshToken =
      generateRefreshToken();


    const newTokenHash =
      generateTokenHash(
        newRefreshToken
      );


    const newExpiresAt = new Date();

    newExpiresAt.setDate(
      newExpiresAt.getDate() + 7
    );


    await tokenRepository.create(
      user.id,
      newTokenHash,
      newExpiresAt,
      ipAddress,
      userAgent
    );


    return {

      accessToken,

      refreshToken:
        newRefreshToken,
    };
  }


  // ============================================================
  // LOGOUT
  // ============================================================

  async logout(refreshToken) {

    if (!refreshToken) {

      throw ApiError.unauthorized(
        'Refresh token not provided'
      );
    }


    const tokenHash =
      generateTokenHash(refreshToken);


    const storedToken =
      await tokenRepository.findByTokenHash(
        tokenHash
      );


    if (storedToken) {

      await tokenRepository.revoke(
        storedToken.id
      );
    }


    return true;
  }
}


module.exports = new AuthService();
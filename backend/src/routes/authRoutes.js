const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validateRegister, authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
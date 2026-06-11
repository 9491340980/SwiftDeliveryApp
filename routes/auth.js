const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOTP } = require('../utils/otp');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('phone').trim().matches(/^\d{10}$/).withMessage('Valid 10-digit phone required'),
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, phone, email, referralCode } = req.body;
    let user = await User.findOne({ phone });

    if (user && user.isActive && !user.isGuest) {
      return res.status(400).json({ success: false, message: 'Phone already registered. Please login.' });
    }

    if (!user) {
      user = new User({ name, phone, email });
      user.referralCode = 'SB' + Math.random().toString(36).substr(2, 6).toUpperCase();
      if (referralCode) user.referredBy = referralCode;
    } else {
      user.name = name;
      user.email = email;
    }

    const otp = user.generateOTP();
    await user.save();
    await sendOTP(phone, otp);

    const devOtp = process.env.SHOW_DEV_OTP === 'true' ? otp : undefined;
    res.json({ success: true, message: 'OTP sent', userId: user._id, ...(devOtp && { devOtp }) });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('phone').trim().matches(/^\d{10}$/).withMessage('Valid phone required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { phone } = req.body;
    let user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: 'Phone not registered' });

    const otp = user.generateOTP();
    await user.save();
    await sendOTP(phone, otp);

    const devOtp = process.env.SHOW_DEV_OTP === 'true' ? otp : undefined;
    res.json({ success: true, message: 'OTP sent', userId: user._id, ...(devOtp && { devOtp }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', [
  body('userId').notEmpty(),
  body('otp').isLength({ min: 4, max: 4 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.verifyOTP(otp)) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isGuest = false;
    await user.save();

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, walletBalance: user.walletBalance, isAdmin: user.isAdmin, addresses: user.addresses },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  try {
    const guest = new User({
      name: 'Guest',
      phone: 'guest_' + Date.now(),
      isGuest: true,
    });
    await guest.save();
    const token = signToken(guest._id);
    res.json({ success: true, token, user: { id: guest._id, name: 'Guest', isGuest: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const otp = user.generateOTP();
    await user.save();
    await sendOTP(user.phone, otp);
    res.json({ success: true, message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

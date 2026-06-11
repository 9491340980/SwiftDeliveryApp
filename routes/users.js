const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users/me
router.get('/me', protect, async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: {
    id: u._id, name: u.name, phone: u.phone, email: u.email,
    avatar: u.avatar, walletBalance: u.walletBalance, addresses: u.addresses,
    referralCode: u.referralCode, isAdmin: u.isAdmin,
    isVendor: u.isVendor, vendorStatus: u.vendorStatus,
    restaurantId: u.restaurantId, vendorApplication: u.vendorApplication,
  }});
});

// PUT /api/users/me
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, avatar },
      { new: true, runValidators: true }
    ).select('-otp -otpExpiry');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/address
router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/address/:id
router.put('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/address/:id
router.delete('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/fcm-token
router.put('/fcm-token', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.token });
  res.json({ success: true });
});

module.exports = router;

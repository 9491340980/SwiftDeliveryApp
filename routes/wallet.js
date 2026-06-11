const express = require('express');
const User = require('../models/User');
const WalletTransaction = require('../models/Wallet');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, balance: user.walletBalance, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/add
router.post('/add', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const user = await User.findById(req.user._id);
    user.walletBalance += Number(amount);
    await user.save();

    const tx = await WalletTransaction.create({
      user: user._id,
      type: 'credit',
      amount: Number(amount),
      balance: user.walletBalance,
      remarks: 'Added to wallet',
    });

    res.json({ success: true, balance: user.walletBalance, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const WalletTransaction = require('../models/Wallet');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders
router.post('/', protect, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, couponCode, deliveryFee, discount, total, subtotal } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    if (!restaurant.isOpen) return res.status(400).json({ success: false, message: 'Restaurant is currently closed' });

    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user._id);
      if (user.walletBalance < total) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      user.walletBalance -= total;
      await user.save();
      await WalletTransaction.create({
        user: user._id, type: 'debit', amount: total,
        balance: user.walletBalance, remarks: 'Order payment',
      });
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      restaurantName: restaurant.name,
      items,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
      couponCode,
      subtotal,
      deliveryFee: deliveryFee || 0,
      discount: discount || 0,
      total,
      estimatedDeliveryTime: restaurant.deliveryTimeMax,
      timeline: [{ status: 'pending', message: 'Order placed successfully' }],
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders (user's orders)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name logo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments({ user: req.user._id });
    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('restaurant', 'name logo phone address');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order at this stage' });
    }
    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by user';
    order.timeline.push({ status: 'cancelled', message: 'Order cancelled' });

    if (order.paymentMethod === 'wallet' || order.paymentStatus === 'paid') {
      const user = await User.findById(req.user._id);
      user.walletBalance += order.total;
      await user.save();
      order.paymentStatus = 'refunded';
      await WalletTransaction.create({
        user: user._id, type: 'credit', amount: order.total,
        balance: user.walletBalance, remarks: 'Order refund', order: order._id,
      });
    }
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/rate
router.patch('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'delivered' },
      { rating, review },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or not delivered' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

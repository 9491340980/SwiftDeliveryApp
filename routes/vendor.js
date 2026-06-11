const express = require('express');
const router = express.Router();
const vendorAuth = require('../middleware/vendorAuth');
const { protect: authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// ── Apply to become vendor (any logged-in user) ──────────────────
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isVendor && user.vendorStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Already an approved vendor' });
    }
    const { restaurantName, storeType, cuisines, addressLine1, addressCity, addressState, phone, description } = req.body;
    if (!restaurantName || !addressCity || !addressState) {
      return res.status(400).json({ success: false, message: 'Store name, city and state are required' });
    }
    user.vendorStatus = 'pending';
    user.vendorApplication = { restaurantName, storeType: storeType || 'restaurant', cuisines, addressLine1, addressCity, addressState, phone, description, appliedAt: new Date() };
    await user.save();
    res.json({ success: true, message: 'Application submitted! Admin will review within 24 hours.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get vendor status ────────────────────────────────────────────
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isVendor vendorStatus vendorApplication restaurantId');
    res.json({ success: true, isVendor: user.isVendor, vendorStatus: user.vendorStatus, vendorApplication: user.vendorApplication, restaurantId: user.restaurantId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── All routes below require approved vendor ─────────────────────
router.use(vendorAuth);

// ── Dashboard stats ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, pendingOrders, revenue] = await Promise.all([
      Order.countDocuments({ restaurant: restaurantId }),
      Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: today } }),
      Order.countDocuments({ restaurant: restaurantId, status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      Order.aggregate([
        { $match: { restaurant: restaurantId, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
    ]);
    const restaurant = await Restaurant.findById(restaurantId).lean();
    res.json({ success: true, stats: { totalOrders, todayOrders, pendingOrders, revenue: revenue[0]?.total || 0 }, restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Orders ───────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 30 } = req.query;
    const filter = { restaurant: req.user.restaurantId };
    if (status) filter.status = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(+limit)
      .populate('user', 'name phone').lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurantId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const { status } = req.body;
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready'],
      ready: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
    };
    if (!allowedTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change from ${order.status} to ${status}` });
    }
    order.status = status;
    order.timeline.push({ status, time: new Date(), message: `Order ${status}` });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Restaurant profile ───────────────────────────────────────────
router.get('/restaurant', async (req, res) => {
  try {
    const r = await Restaurant.findById(req.user.restaurantId).lean();
    res.json({ success: true, restaurant: r });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/restaurant', async (req, res) => {
  try {
    const allowed = ['name', 'description', 'logo', 'banner', 'phone', 'email', 'cuisines', 'deliveryTimeMin', 'deliveryTimeMax', 'deliveryFee', 'minOrderAmount', 'isOpen', 'offerText', 'address'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const r = await Restaurant.findByIdAndUpdate(req.user.restaurantId, update, { new: true });
    res.json({ success: true, restaurant: r });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Menu items ───────────────────────────────────────────────────
router.get('/menu-items', async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant: req.user.restaurantId }).sort({ menuCategory: 1, name: 1 }).lean();
    res.json({ success: true, menuItems: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/menu-items', async (req, res) => {
  try {
    const item = new MenuItem({ ...req.body, restaurant: req.user.restaurantId });
    await item.save();
    res.json({ success: true, menuItem: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/menu-items/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, restaurant: req.user.restaurantId }, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, menuItem: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/menu-items/:id', async (req, res) => {
  try {
    await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurantId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Offer = require('../models/Offer');
const Order = require('../models/Order');

router.use(adminAuth);

// ── Dashboard Stats ─────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [restaurants, categories, orders, users, revenue] = await Promise.all([
      Restaurant.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ isGuest: false }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
    ]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)
      .populate('user', 'name phone').lean();
    res.json({
      success: true,
      stats: {
        restaurants, categories, orders, users,
        revenue: revenue[0]?.total || 0,
      },
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Restaurants ──────────────────────────────────────────────────
router.get('/restaurants', async (req, res) => {
  try {
    const list = await Restaurant.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, restaurants: list });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/restaurants', async (req, res) => {
  try {
    const r = new Restaurant(req.body);
    await r.save();
    res.json({ success: true, restaurant: r });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/restaurants/:id', async (req, res) => {
  try {
    const r = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, restaurant: r });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/restaurants/:id', async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    await MenuItem.deleteMany({ restaurant: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Categories ───────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const list = await Category.find().sort({ order: 1 }).lean();
    res.json({ success: true, categories: list });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/categories', async (req, res) => {
  try {
    const c = new Category(req.body);
    await c.save();
    res.json({ success: true, category: c });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category: c });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Menu Items ───────────────────────────────────────────────────
router.get('/menu-items', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = restaurantId ? { restaurant: restaurantId } : {};
    const list = await MenuItem.find(filter).populate('restaurant', 'name').sort({ createdAt: -1 }).lean();
    res.json({ success: true, menuItems: list });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/menu-items', async (req, res) => {
  try {
    const m = new MenuItem(req.body);
    await m.save();
    res.json({ success: true, menuItem: m });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/menu-items/:id', async (req, res) => {
  try {
    const m = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, menuItem: m });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/menu-items/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Offers ───────────────────────────────────────────────────────
router.get('/offers', async (req, res) => {
  try {
    const list = await Offer.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, offers: list });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/offers', async (req, res) => {
  try {
    const o = new Offer(req.body);
    await o.save();
    res.json({ success: true, offer: o });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/offers/:id', async (req, res) => {
  try {
    const o = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, offer: o });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/offers/:id', async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Orders ───────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('user', 'name phone')
      .lean();
    const total = await Order.countDocuments(filter);
    res.json({ success: true, orders, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, $push: { timeline: { status, time: new Date(), message: `Status updated to ${status}` } } },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── Users ────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({ isGuest: false })
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();
    const total = await User.countDocuments({ isGuest: false });
    res.json({ success: true, users, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Vendor Applications ──────────────────────────────────────────
// Support both /vendors and /vendor-applications for compatibility
const vendorListHandler = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = status === 'all' ? { vendorStatus: { $ne: 'none' } } : { vendorStatus: status };
    const vendors = await User.find(filter).select('name phone email vendorStatus vendorApplication restaurantId createdAt isVendor').lean();
    res.json({ success: true, vendors });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

router.get('/vendors', vendorListHandler);
router.get('/vendor-applications', vendorListHandler);

const approveVendorHandler = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.vendorStatus === 'approved' && user.restaurantId) {
      return res.json({ success: true, message: 'Already approved' });
    }
    const app = user.vendorApplication;
    const restaurant = new Restaurant({
      name: app.restaurantName,
      storeType: app.storeType || 'restaurant',
      cuisines: app.cuisines ? app.cuisines.split(',').map(s => s.trim()).filter(Boolean) : [],
      address: { line1: app.addressLine1, city: app.addressCity, state: app.addressState },
      phone: app.phone,
      description: app.description,
      isOpen: true,
      isActive: true,
      managedBy: user._id,
    });
    await restaurant.save();
    user.isVendor = true;
    user.vendorStatus = 'approved';
    user.restaurantId = restaurant._id;
    await user.save();
    res.json({ success: true, message: 'Vendor approved! Restaurant created.', restaurant });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const rejectVendorHandler = async (req, res) => {
  try {
    const { reason } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      vendorStatus: 'rejected',
      'vendorApplication.rejectionReason': reason || 'Application not approved',
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Support both PUT (old) and POST (new frontend) for approve/reject
router.post('/vendors/:id/approve', approveVendorHandler);
router.put('/vendors/:id/approve', approveVendorHandler);
router.post('/vendors/:id/reject', rejectVendorHandler);
router.put('/vendors/:id/reject', rejectVendorHandler);
router.put('/vendor-applications/:id/approve', approveVendorHandler);
router.put('/vendor-applications/:id/reject', rejectVendorHandler);

module.exports = router;

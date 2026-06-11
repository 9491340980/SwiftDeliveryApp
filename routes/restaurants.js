const express = require('express');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/restaurants?lat=&lng=&category=&search=&page=&limit=
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, featured, sort } = req.query;
    const query = { isActive: true };

    if (category) query.categories = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };

    let sortObj = {};
    if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'delivery') sortObj = { deliveryTimeMin: 1 };
    else sortObj = { isFeatured: -1, rating: -1 };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .populate('categories', 'name slug')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Restaurant.countDocuments(query),
    ]);

    res.json({ success: true, restaurants, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/restaurants/best-sellers
router.get('/best-sellers', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true, isFeatured: true })
      .select('name logo rating deliveryTimeMin deliveryTimeMax address cuisines')
      .limit(10);
    res.json({ success: true, restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('categories');
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/restaurants/:id/menu
router.get('/:id/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.id }).sort({ menuCategory: 1, isBestSeller: -1 });

    // Group by menu category
    const menu = {};
    items.forEach(item => {
      if (!menu[item.menuCategory]) menu[item.menuCategory] = [];
      menu[item.menuCategory].push(item);
    });

    res.json({ success: true, menu });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

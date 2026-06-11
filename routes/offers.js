const express = require('express');
const Offer = require('../models/Offer');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({ isActive: true, validFrom: { $lte: now }, $or: [{ validUntil: { $gte: now } }, { validUntil: null }] });
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/validate', protect, async (req, res) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;
    const now = new Date();
    const offer = await Offer.findOne({ code: code.toUpperCase(), isActive: true, validFrom: { $lte: now }, $or: [{ validUntil: { $gte: now } }, { validUntil: null }] });

    if (!offer) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
    if (orderAmount < offer.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order ₹${offer.minOrderAmount} required` });
    }
    if (offer.applicableRestaurants.length > 0 && !offer.applicableRestaurants.includes(restaurantId)) {
      return res.status(400).json({ success: false, message: 'Coupon not valid for this restaurant' });
    }

    let discount = 0;
    if (offer.type === 'percent') {
      discount = (orderAmount * offer.value) / 100;
      if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
    } else if (offer.type === 'flat') {
      discount = offer.value;
    } else if (offer.type === 'free_delivery') {
      discount = 0;
    }

    res.json({ success: true, offer, discount: Math.round(discount) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const timingSchema = new mongoose.Schema({
  day: { type: String },
  open: { type: String },
  close: { type: String },
  isClosed: { type: Boolean, default: false },
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  phone: { type: String },
  email: { type: String },
  address: {
    line1: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  cuisines: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  deliveryTimeMin: { type: Number, default: 20 },
  deliveryTimeMax: { type: Number, default: 50 },
  deliveryFee: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
  timings: [timingSchema],
  offerText: { type: String },
}, { timestamps: true });

restaurantSchema.index({ 'address.lat': 1, 'address.lng': 1 });
restaurantSchema.index({ name: 'text', cuisines: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);

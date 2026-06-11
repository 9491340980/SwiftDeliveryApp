const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  menuCategory: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  discountPercent: { type: Number, default: 0 },
  isVeg: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  addons: [addonSchema],
  preparationTime: { type: Number, default: 15 },
  tags: [{ type: String }],
}, { timestamps: true });

menuItemSchema.index({ restaurant: 1, menuCategory: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);

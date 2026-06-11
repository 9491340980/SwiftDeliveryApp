const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  type: { type: String, enum: ['percent', 'flat', 'free_delivery'], required: true },
  value: { type: Number },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  userLimit: { type: Number, default: 1 },
  applicableRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

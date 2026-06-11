const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  addons: [{ name: String, price: Number }],
  isVeg: { type: Boolean },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  restaurantName: { type: String },
  items: [orderItemSchema],
  deliveryAddress: {
    label: String,
    line1: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: { type: String, enum: ['cod', 'wallet', 'online'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true },
  estimatedDeliveryTime: { type: Number },
  deliveredAt: { type: Date },
  cancelReason: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  timeline: [{
    status: String,
    time: { type: Date, default: Date.now },
    message: String,
  }],
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'SB' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

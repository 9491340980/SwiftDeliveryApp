const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  line1: String,
  city: String,
  state: String,
  pincode: String,
  lat: Number,
  lng: Number,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  avatar: { type: String, default: '' },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String },
  addresses: [addressSchema],
  walletBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isGuest: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  fcmToken: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  return otp;
};

userSchema.methods.verifyOTP = function (otp) {
  return this.otp === otp && this.otpExpiry > new Date();
};

module.exports = mongoose.model('User', userSchema);

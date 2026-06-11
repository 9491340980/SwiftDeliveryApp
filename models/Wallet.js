const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  remarks: { type: String },
  reference: { type: String },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', transactionSchema);

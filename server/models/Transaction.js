const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
  amount: { type: Number, default: 500 },
  method: { type: String, enum: ['CBE', 'Telebirr', 'Other'], default: 'Other' },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  approvedBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);

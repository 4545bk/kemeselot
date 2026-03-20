const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);

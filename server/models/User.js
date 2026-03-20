const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  firebaseUid: { type: String, unique: true, sparse: true },
  isPremium: { type: Boolean, default: false },
  premiumSince: { type: Date, default: null },
  premiumExpiry: { type: Date, default: null }, // null = lifetime
  deviceId: { type: String, default: '' },
  profilePic: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

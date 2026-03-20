const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Check if phone already exists
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ name, phone, passwordHash });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        isPremium: user.isPremium,
        profilePic: user.profilePic,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
        profilePic: user.profilePic,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== FIREBASE AUTH (PHONE & GOOGLE) ====================
router.post('/firebase', async (req, res) => {
  try {
    const { firebaseUid, name, phone, email, profilePic } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // If no user found by UID, check if phone or email matches and link accounts
      const query = [];
      if (phone) query.push({ phone });
      if (email) query.push({ email });

      if (query.length > 0) {
        user = await User.findOne({ $or: query });
      }

      if (user) {
        // Link existing user
        user.firebaseUid = firebaseUid;
        if (profilePic && !user.profilePic) user.profilePic = profilePic;
        if (phone && !user.phone) user.phone = phone;
        await user.save();
      } else {
        // Create new user
        user = new User({
          name: name || 'User',
          phone,
          email,
          firebaseUid,
          profilePic: profilePic || '',
        });
        await user.save();
      }
    } else {
      // Update info if provided
      let changed = false;
      if (profilePic && user.profilePic !== profilePic) { user.profilePic = profilePic; changed = true; }
      if (phone && !user.phone) { user.phone = phone; changed = true; }
      if (email && !user.email) { user.email = email; changed = true; }
      if (changed) await user.save();
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
        profilePic: user.profilePic,
      }
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== GET CURRENT USER ====================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
        profilePic: user.profilePic,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

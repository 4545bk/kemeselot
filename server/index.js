require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const Receipt = require('./models/Receipt');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const authRoutes = require('./routes/auth');
const { authMiddleware } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Telegram Bot — enable polling to listen for inline button callbacks
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = botToken ? new TelegramBot(botToken, { polling: true }) : null;

// ==================== TELEGRAM CALLBACK HANDLING ====================
if (bot) {
  bot.on('callback_query', async (query) => {
    const data = query.data; // e.g. "approve_<receiptId>" or "reject_<receiptId>"
    if (!data) return;

    try {
      if (data.startsWith('approve_')) {
        const receiptId = data.replace('approve_', '');
        const receipt = await Receipt.findByIdAndUpdate(
          receiptId,
          { status: 'approved', reviewedAt: new Date() },
          { new: true }
        );
        if (!receipt) {
          await bot.answerCallbackQuery(query.id, { text: '❌ Receipt not found' });
          return;
        }

        // Upgrade user to Premium
        await User.findByIdAndUpdate(receipt.userId, {
          isPremium: true,
          premiumSince: new Date(),
        });

        // Complete transaction
        await Transaction.findOneAndUpdate(
          { receiptId: receipt._id },
          { status: 'completed', approvedBy: 'telegram_admin' }
        );

        const user = await User.findById(receipt.userId);
        await bot.answerCallbackQuery(query.id, { text: '✅ Approved!' });
        await bot.editMessageCaption(
          `✅ APPROVED\n\n👤 ${user?.name || 'Unknown'}\n📱 ${user?.phone || user?.email || 'N/A'}\n⏰ ${new Date().toLocaleString()}`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
          }
        );
      } else if (data.startsWith('reject_')) {
        const receiptId = data.replace('reject_', '');
        const receipt = await Receipt.findByIdAndUpdate(
          receiptId,
          { status: 'rejected', reviewedAt: new Date(), adminNote: 'Rejected via Telegram' },
          { new: true }
        );
        if (!receipt) {
          await bot.answerCallbackQuery(query.id, { text: '❌ Receipt not found' });
          return;
        }

        // Reject transaction
        await Transaction.findOneAndUpdate(
          { receiptId: receipt._id },
          { status: 'rejected' }
        );

        const user = await User.findById(receipt.userId);
        await bot.answerCallbackQuery(query.id, { text: '❌ Rejected' });
        await bot.editMessageCaption(
          `❌ REJECTED\n\n👤 ${user?.name || 'Unknown'}\n📱 ${user?.phone || user?.email || 'N/A'}\n⏰ ${new Date().toLocaleString()}`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
          }
        );
      }
    } catch (err) {
      console.error('Telegram callback error:', err);
      await bot.answerCallbackQuery(query.id, { text: '⚠️ Error processing' }).catch(() => {});
    }
  });
}

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ==================== AUTH ROUTES ====================
app.use('/api/auth', authRoutes);

// ==================== MOBILE APP ENDPOINTS ====================

// Upload Receipt (AUTHENTICATED)
app.post('/api/upload-receipt', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing image file' });

    const baseUrl = req.protocol + '://' + req.get('host');
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Check for existing pending receipt
    let receipt = await Receipt.findOne({ userId: req.userId, status: 'pending' });
    if (receipt) {
      receipt.imageUrl = imageUrl;
      await receipt.save();
    } else {
      receipt = new Receipt({ userId: req.userId, imageUrl });
      await receipt.save();
    }

    // Create pending transaction
    await Transaction.findOneAndUpdate(
      { userId: req.userId, status: 'pending' },
      { userId: req.userId, receiptId: receipt._id, status: 'pending' },
      { upsert: true, new: true }
    );

    // Get user info for Telegram notification
    const user = await User.findById(req.userId);
    const userName = user ? user.name : 'Unknown';
    const userPhone = user ? (user.phone || user.email || 'N/A') : 'N/A';

    // Notify Telegram with Accept/Reject inline buttons
    if (bot && chatId) {
      try {
        const caption = `🧾 *New Payment Receipt*\n\n👤 *Name:* ${userName}\n📱 *Phone:* ${userPhone}\n🆔 *User ID:* \`${req.userId}\`\n⏰ *Time:* ${new Date().toLocaleString()}`;
        const photoPath = path.join(__dirname, 'uploads', req.file.filename);
        
        await bot.sendPhoto(chatId, photoPath, {
          parse_mode: 'Markdown',
          caption,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_${receipt._id}` },
                { text: '❌ Reject', callback_data: `reject_${receipt._id}` },
              ]
            ]
          }
        });
      } catch (tgError) {
        console.error('Telegram notification failed:', tgError);
      }
    }

    res.status(201).json({ message: 'Receipt uploaded successfully', receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Payment Status (AUTHENTICATED) — enhanced with rejection reason
app.get('/api/payment-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.isPremium) return res.json({ status: 'approved' });

    const pending = await Receipt.findOne({ userId: req.userId, status: 'pending' });
    if (pending) return res.json({ status: 'pending', submittedAt: pending.createdAt });

    const rejected = await Receipt.findOne({ userId: req.userId, status: 'rejected' }).sort({ createdAt: -1 });
    if (rejected) return res.json({ 
      status: 'rejected', 
      note: rejected.adminNote || 'Your receipt was not accepted. Please try again with a clearer image.',
      rejectedAt: rejected.reviewedAt 
    });

    res.json({ status: 'none' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Get all receipts with user info
app.get('/api/admin/receipts', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 }).lean();
    
    // Populate user info
    const enriched = await Promise.all(receipts.map(async (r) => {
      const user = await User.findById(r.userId).select('name phone email').lean();
      return { ...r, user: user || { name: 'Unknown', phone: 'N/A' } };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve Receipt
app.post('/api/admin/approve/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id, 
      { status: 'approved', reviewedAt: new Date() }, 
      { new: true }
    );
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    // Upgrade user to Premium
    await User.findByIdAndUpdate(receipt.userId, {
      isPremium: true,
      premiumSince: new Date(),
    });

    // Complete the transaction
    await Transaction.findOneAndUpdate(
      { receiptId: receipt._id },
      { status: 'completed', approvedBy: 'admin' }
    );

    if (bot && chatId) {
      const user = await User.findById(receipt.userId);
      bot.sendMessage(chatId, `✅ Receipt approved for *${user?.name || 'Unknown'}* (${user?.phone || user?.email || 'N/A'})`, { parse_mode: 'Markdown' }).catch(console.error);
    }

    res.json({ message: 'Approved successfully', receipt });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject Receipt
app.post('/api/admin/reject/:id', async (req, res) => {
  try {
    const { note } = req.body || {};
    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id, 
      { status: 'rejected', reviewedAt: new Date(), adminNote: note || 'Rejected by admin' }, 
      { new: true }
    );

    if (bot && chatId && receipt) {
      const user = await User.findById(receipt.userId);
      bot.sendMessage(chatId, `❌ Receipt rejected for *${user?.name || 'Unknown'}*`, { parse_mode: 'Markdown' }).catch(console.error);
    }

    res.json({ message: 'Rejected successfully', receipt });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check for deployment
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (0.0.0.0)`);
});

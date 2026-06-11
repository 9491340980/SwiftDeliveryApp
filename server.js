require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/wallet', require('./routes/wallet'));

app.get('/api/health', (req, res) => res.json({
  status: 'SwiftBite API running',
  version: '1.0.0',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

app.get('/api/test-db', async (req, res) => {
  const state = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  try {
    const User = require('./models/User');
    const count = await User.countDocuments().maxTimeMS(5000);
    res.json({ readyState: state, stateLabel: states[state], queryResult: count, ok: true });
  } catch (err) {
    res.json({ readyState: state, stateLabel: states[state], error: err.message, ok: false });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;

// Start server ONLY after MongoDB connects
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀  SwiftBite server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Could not connect to MongoDB, server not started:', err.message);
  process.exit(1);
});

module.exports = app;

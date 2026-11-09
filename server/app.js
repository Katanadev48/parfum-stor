const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/client', express.static(path.join(__dirname, '..', 'client')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Unhandled API request error:', error);
  return res.status(500).json({ message: 'حدث خطأ في الخادم. حاول مجددًا.' });
});
app.get('/health', (req, res) => res.json({
  ok: true,
  service: 'KATANA PARFUM',
  database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
}));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

module.exports = app;

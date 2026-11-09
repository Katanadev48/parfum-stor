const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }));
app.use('/api/auth/admin-login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  message: { message: 'محاولات كثيرة. حاول مرة أخرى بعد قليل.' }
}));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/client', express.static(path.join(__dirname, '..', 'client')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/settings', (req, res) => res.json({
  heroTitle: 'اكتشف عطرك المميز',
  heroDescription: 'عطور مختارة بعناية لتمنحك حضورًا لا يُنسى.',
  whatsapp: '0778379244'
}));
app.post('/api/orders', (req, res) => res.status(410).json({
  message: 'لا يتم حفظ الطلبات في الموقع. أرسل طلبك عبر واتساب من صفحة إتمام الطلب.'
}));
app.post('/api/newsletter', (req, res) => res.status(501).json({
  message: 'الاشتراك بالبريد غير متاح حاليًا.'
}));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Unhandled API request error:', error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : 'حدث خطأ في الخادم. حاول مجددًا.'
  });
});
app.get('/health', (req, res) => res.json({
  ok: true,
  service: 'KATANA PARFUM',
  storage: 'static files; no database'
}));
app.get('/login.html', (req, res) => res.redirect(302, '/admin/login.html'));
app.get('/register.html', (req, res) => res.redirect(302, '/'));
app.get('/account.html', (req, res) => res.redirect(302, '/'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

module.exports = app;

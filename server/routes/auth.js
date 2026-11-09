const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

const router = express.Router();
const digest = value => crypto.createHash('sha256').update(value).digest();

router.post('/admin-login', (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  const missingSettings = [];
  if (!adminEmail) missingSettings.push('ADMIN_EMAIL');
  if (typeof adminPassword !== 'string' || adminPassword.length < 12) {
    missingSettings.push('ADMIN_PASSWORD (12 characters minimum)');
  }
  if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
    missingSettings.push('JWT_SECRET (32 characters minimum)');
  }
  if (missingSettings.length) {
    return res.status(503).json({
      message: `إعدادات دخول الإدارة ناقصة في Vercel: ${missingSettings.join(', ')}`
    });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (email.length > 254 || password.length > 1024) {
    return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صالحة' });
  }
  const emailMatches = crypto.timingSafeEqual(digest(email), digest(adminEmail));
  const passwordMatches = crypto.timingSafeEqual(digest(password), digest(adminPassword));
  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const token = jwt.sign({ sub: 'admin', email: adminEmail, role: 'admin' }, jwtSecret, {
    expiresIn: '12h'
  });
  return res.json({
    token,
    user: { id: 'admin', email: adminEmail, role: 'admin' }
  });
});

router.post('/register', (req, res) => res.status(410).json({
  message: 'إنشاء حسابات الزبناء غير متاح. يمكن إتمام الطلب دون حساب.'
}));
router.post('/login', (req, res) => res.status(410).json({
  message: 'تسجيل دخول الزبناء غير متاح. يمكن إتمام الطلب دون حساب.'
}));
router.get('/me', protect, (req, res) => res.json({ user: req.user }));
router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

module.exports = router;

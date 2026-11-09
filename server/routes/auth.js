const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

const router = express.Router();
const digest = value => crypto.createHash('sha256').update(value).digest();

router.post('/admin-login', (req, res, next) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  if (!adminEmail || adminPassword?.length < 12 || jwtSecret?.length < 32) {
    return next(new Error('Set ADMIN_EMAIL, an ADMIN_PASSWORD of at least 12 characters, and a JWT_SECRET of at least 32 characters'));
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
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

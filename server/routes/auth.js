const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
function requireJwtSecret(req, res, next) {
  if (!process.env.JWT_SECRET) return next(new Error('JWT_SECRET is required'));
  return next();
}
const tokenFor = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  wishlist: user.wishlist
});

router.post('/register', requireJwtSecret, async (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Name, email and an 8-character password are required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12)
    });
    return res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    return next(error);
  }
});

router.post('/login', requireJwtSecret, async (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }
    return res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));
router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

router.put('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: req.body.name, phone: req.body.phone },
      { new: true, runValidators: true }
    );
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/wishlist/:productId', protect, async (req, res, next) => {
  try {
    const has = req.user.wishlist.some(id => id.toString() === req.params.productId);
    const update = has
      ? { $pull: { wishlist: req.params.productId } }
      : { $addToSet: { wishlist: req.params.productId } };
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    return res.json({ wishlist: user.wishlist });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

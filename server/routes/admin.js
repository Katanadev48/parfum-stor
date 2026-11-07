const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/summary', async (req, res) => {
  const [products, customers, orders, revenue, pending, delivered, lowStock] = await Promise.all([
    Product.countDocuments({ active: true }),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ status: 'Pending' }),
    Order.countDocuments({ status: 'Delivered' }),
    Product.countDocuments({ active: true, stock: { $lte: 5 } })
  ]);
  res.json({ products, customers, orders, revenue: revenue[0]?.total || 0, pending, delivered, lowStock });
});

module.exports = router;

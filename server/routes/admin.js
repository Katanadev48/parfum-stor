const express = require('express');
const products = require('../data/products.json');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/summary', (req, res) => res.json({
  products: products.filter(product => product.active).length,
  customers: 0,
  orders: 0,
  revenue: 0,
  pending: 0,
  delivered: 0,
  lowStock: 0,
  storage: 'file'
}));

module.exports = router;

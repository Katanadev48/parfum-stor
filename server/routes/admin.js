const express = require('express');
const products = require('../data/products.json');
const { protect, adminOnly } = require('../middleware/auth');
const { sendToSheets } = require('../lib/orders-store');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/summary', (req, res) => res.json({
  products: products.filter(product => product.active).length,
  storage: 'Google Sheets'
}));

router.get('/orders', async (req, res, next) => {
  try {
    const result = await sendToSheets('list');
    return res.json(result.orders);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

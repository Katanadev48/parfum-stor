const express = require('express');
const products = require('../data/products.json');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
const sortMap = {
  newest: () => 0,
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
  rated: (a, b) => b.rating - a.rating,
  best: (a, b) => Number(b.bestSeller) - Number(a.bestSeller)
};

router.get('/', (req, res) => {
  const { q = '', category, gender, min, max, sort = 'newest', page = '1', limit = '12' } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const minPrice = min === undefined ? undefined : Number(min);
  const maxPrice = max === undefined ? undefined : Number(max);

  if (typeof q !== 'string' || q.length > 100 ||
      !Number.isSafeInteger(pageNumber) || pageNumber < 1 ||
      !Number.isSafeInteger(limitNumber) || limitNumber < 1 || limitNumber > 100 ||
      (min !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (max !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) ||
      (gender !== undefined && !['Men', 'Women', 'Unisex'].includes(gender))) {
    return res.status(400).json({ message: 'معايير البحث أو التصفية غير صالحة' });
  }

  const term = q.trim().toLocaleLowerCase();
  const matchingProducts = products
    .filter(product => product.active)
    .filter(product => !term || [
      product.name, product.description, product.category, product.gender,
      product.fragranceFamily, ...product.tags, ...product.topNotes,
      ...product.heartNotes, ...product.baseNotes
    ].some(value => value.toLocaleLowerCase().includes(term)))
    .filter(product => !category || product.category === category)
    .filter(product => !gender || product.gender === gender)
    .filter(product => minPrice === undefined || product.price >= minPrice)
    .filter(product => maxPrice === undefined || product.price <= maxPrice)
    .sort(sortMap[sort] || sortMap.newest);
  const skip = (pageNumber - 1) * limitNumber;
  if (!Number.isSafeInteger(skip)) {
    return res.status(400).json({ message: 'رقم الصفحة كبير جدًا' });
  }

  return res.json({
    products: matchingProducts.slice(skip, skip + limitNumber),
    total: matchingProducts.length,
    page: pageNumber,
    pages: Math.ceil(matchingProducts.length / limitNumber)
  });
});

router.get('/:id', (req, res) => {
  const product = products.find(item => item._id === req.params.id && item.active);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.json(product);
});

router.post('/', protect, adminOnly, (req, res) => res.status(501).json({
  message: 'المنتجات محفوظة فملف المشروع. عدّل server/data/products.json ثم أعد النشر.'
}));
router.put('/:id', protect, adminOnly, (req, res) => res.status(501).json({
  message: 'المنتجات محفوظة فملف المشروع. عدّل server/data/products.json ثم أعد النشر.'
}));
router.delete('/:id', protect, adminOnly, (req, res) => res.status(501).json({
  message: 'المنتجات محفوظة فملف المشروع. عدّل server/data/products.json ثم أعد النشر.'
}));

module.exports = router;

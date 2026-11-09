const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
const sortMap = {
  newest: { createdAt: -1 },
  low: { price: 1 },
  high: { price: -1 },
  rated: { rating: -1 },
  best: { bestSeller: -1 }
};

router.get('/', async (req, res, next) => {
  const { q, category, gender, min, max, sort = 'newest', page = '1', limit = '12' } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const minPrice = min === undefined ? undefined : Number(min);
  const maxPrice = max === undefined ? undefined : Number(max);

  if (!Number.isSafeInteger(pageNumber) || pageNumber < 1 ||
      !Number.isSafeInteger(limitNumber) || limitNumber < 1 || limitNumber > 100 ||
      (min !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (max !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) ||
      (q !== undefined && (typeof q !== 'string' || q.length > 100)) ||
      (category !== undefined && typeof category !== 'string') ||
      (gender !== undefined && !['Men', 'Women', 'Unisex'].includes(gender))) {
    return res.status(400).json({ message: 'معايير البحث أو التصفية غير صالحة' });
  }

  const filter = { active: true };
  if (q?.trim()) filter.$text = { $search: q.trim() };
  if (category) filter.category = category;
  if (gender) filter.gender = gender;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  try {
    const skip = (pageNumber - 1) * limitNumber;
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(limitNumber),
      Product.countDocuments(filter)
    ]);
    return res.json({ products, total, page: pageNumber, pages: Math.ceil(total / limitNumber) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found' });
  }
  try {
    const product = await Product.findOne({ _id: req.params.id, active: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ message: 'Product name is required' });
    const slug = typeof req.body.slug === 'string' && req.body.slug.trim()
      ? req.body.slug.trim()
      : name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
        `product-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const product = await Product.create({ ...req.body, name, slug });
    return res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A product with this slug already exists' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return next(error);
  }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found' });
  }
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return next(error);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found' });
  }
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product archived' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

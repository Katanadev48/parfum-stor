const crypto = require('crypto');
const express = require('express');
const products = require('../data/products.json');
const { protect, adminOnly } = require('../middleware/auth');
const { sendToSheets } = require('../lib/orders-store');

const router = express.Router();
const maxLengths = { name: 80, phone: 30, city: 100, address: 300, notes: 1000 };
const statuses = ['New', 'Contacted', 'Delivered', 'Cancelled'];

router.post('/', async (req, res, next) => {
  const { items, customer } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
      !customer || typeof customer !== 'object' || Array.isArray(customer)) {
    return res.status(400).json({ message: 'المنتجات أو معلومات التوصيل ناقصة.' });
  }

  for (const field of ['name', 'phone', 'city', 'address']) {
    if (typeof customer[field] !== 'string' || !customer[field].trim() ||
        customer[field].length > maxLengths[field]) {
      return res.status(400).json({ message: 'الاسم ورقم الهاتف والمدينة والعنوان مطلوبون.' });
    }
  }
  if (customer.notes !== undefined &&
      (typeof customer.notes !== 'string' || customer.notes.length > maxLengths.notes)) {
    return res.status(400).json({ message: 'ملاحظة التوصيل غير صالحة.' });
  }

  const quantities = new Map();
  for (const item of items) {
    if (!item || typeof item.product !== 'string' ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return res.status(400).json({ message: 'أحد المنتجات أو الكميات غير صالح.' });
    }
    quantities.set(item.product, (quantities.get(item.product) || 0) + item.quantity);
  }
  if ([...quantities.values()].some(quantity => quantity > 20)) {
    return res.status(400).json({ message: 'الكمية المطلوبة كبيرة جدًا.' });
  }

  const orderItems = [...quantities.entries()].map(([id, quantity]) => {
    const product = products.find(entry => entry._id === id && entry.active);
    return product && {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0]
    };
  });
  if (orderItems.some(item => !item)) {
    return res.status(400).json({ message: 'أحد المنتجات لم يعد متوفرًا. حدّث الصفحة وحاول مجددًا.' });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const date = new Date();
  const order = {
    orderId: `KP-${date.toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    createdAt: date.toISOString(),
    status: 'New',
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      city: customer.city.trim(),
      address: customer.address.trim(),
      notes: customer.notes?.trim() || ''
    },
    items: orderItems,
    subtotal,
    total: subtotal
  };

  try {
    await sendToSheets('create', { order });
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
});

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const result = await sendToSheets('list');
    return res.json(result.orders);
  } catch (error) {
    return next(error);
  }
});

router.put('/:orderId/status', protect, adminOnly, async (req, res, next) => {
  const { status } = req.body || {};
  if (!statuses.includes(status)) {
    return res.status(400).json({ message: 'حالة الطلب غير صالحة.' });
  }
  try {
    const result = await sendToSheets('status', {
      orderId: req.params.orderId,
      status
    });
    return res.json(result.order);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

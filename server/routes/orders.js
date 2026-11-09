const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { protect, optionalProtect, adminOnly } = require('../middleware/auth');
const router = express.Router();
function nextOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `KP-${date}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function restoreStock(reserved) {
  while (reserved.length) {
    const item = reserved[reserved.length - 1];
    const result = await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } }
    );
    if (result.matchedCount !== 1) throw new Error(`Could not restore stock for ${item.product}`);
    reserved.pop();
  }
}

router.post('/', optionalProtect, async (req, res) => {
  const { items, customer } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
      typeof customer?.name !== 'string' || !customer.name.trim() ||
      typeof customer?.phone !== 'string' || !customer.phone.trim() ||
      typeof customer?.address !== 'string' || !customer.address.trim()) {
    return res.status(400).json({ message: 'بيانات الطلب ناقصة أو غير صالحة' });
  }
  for (const [field, maxLength] of Object.entries({
    name: 80, email: 254, phone: 30, city: 100, address: 300, notes: 1000
  })) {
    if (customer[field] !== undefined &&
        (typeof customer[field] !== 'string' || customer[field].length > maxLength)) {
      return res.status(400).json({ message: 'بيانات العميل غير صالحة' });
    }
  }

  const quantities = new Map();
  for (const item of items) {
    if (!item?.product || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ message: 'المنتجات أو الكميات غير صالحة' });
    }
    quantities.set(item.product, (quantities.get(item.product) || 0) + item.quantity);
  }
  if ([...quantities.values()].some(quantity => !Number.isSafeInteger(quantity))) {
    return res.status(400).json({ message: 'الكمية المطلوبة كبيرة جدًا' });
  }

  const reserved = [];
  try {
    const products = await Product.find({ _id: { $in: [...quantities.keys()] }, active: true });
    if (products.length !== quantities.size) {
      return res.status(400).json({ message: 'أحد المنتجات لم يعد متوفرًا' });
    }

    const orderItems = products.map(product => ({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: quantities.get(product._id.toString()),
      image: product.images?.[0]
    }));
    const settings = await Settings.findOne({ key: 'main' });
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 300;
    const delivery = subtotal >= freeDeliveryThreshold ? 0 : (settings?.deliveryPrice ?? 0);

    for (const item of orderItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, active: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!product) {
        await restoreStock(reserved);
        return res.status(409).json({ message: 'نفد مخزون أحد المنتجات. حدّث سلتك وحاول مجددًا.' });
      }
      reserved.push(item);
    }

    const order = await Order.create({
      orderId: nextOrderId(),
      user: req.user?._id,
      customer: {
        name: customer.name.trim(),
        email: customer.email?.trim(),
        phone: customer.phone.trim(),
        city: customer.city?.trim(),
        address: customer.address.trim(),
        notes: customer.notes?.trim()
      },
      items: orderItems,
      subtotal,
      delivery,
      discount: 0,
      total: subtotal + delivery
    });
    res.status(201).json(order);
  } catch (error) {
    try {
      await restoreStock(reserved);
    } catch (restoreError) {
      console.error('Failed to restore stock after order creation failed:', restoreError);
      return res.status(500).json({ message: 'تعذر إكمال الطلب. يرجى التواصل مع خدمة العملاء.' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Failed to create order:', error);
    res.status(500).json({ message: 'تعذر إكمال الطلب. حاول مجددًا.' });
  }
});
router.get('/', protect, async (req, res) => { const filter = req.user.role === 'admin' ? {} : { user: req.user._id }; res.json(await Order.find(filter).sort({ createdAt: -1 })); });
router.get('/:id', protect, async (req, res) => { const order = await Order.findOne({ $or: [{ _id: req.params.id }, { orderId: req.params.id }] }); if (!order || (req.user.role !== 'admin' && String(order.user) !== String(req.user._id))) return res.status(404).json({ message: 'Order not found' }); res.json(order); });
router.put('/:id/status', protect, adminOnly, async (req, res) => { const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); res.json(order); });
module.exports = router;

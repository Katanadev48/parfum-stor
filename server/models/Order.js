const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { name: String, email: String, phone: String, city: String, address: String, notes: String },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, quantity: Number, image: String }],
  subtotal: Number, delivery: Number, discount: { type: Number, default: 0 }, total: Number,
  paymentMethod: { type: String, enum: ['cod'], default: 'cod' }, status: { type: String, enum: ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);

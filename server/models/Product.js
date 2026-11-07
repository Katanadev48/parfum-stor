const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, unique: true }, brand: { type: String, default: 'KATANA PARFUM' },
  category: { type: String, required: true }, gender: { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' }, price: { type: Number, required: true, min: 0 }, oldPrice: Number,
  stock: { type: Number, default: 0, min: 0 }, volume: { type: String, default: '50ml' }, concentration: String, shortDescription: String, description: String,
  fragranceFamily: String, topNotes: [String], heartNotes: [String], baseNotes: [String], tags: [String], images: [String], rating: { type: Number, default: 0 }, reviewsCount: { type: Number, default: 0 }, featured: Boolean, bestSeller: Boolean, isNew: Boolean, active: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text', gender: 'text', tags: 'text', topNotes: 'text', heartNotes: 'text', baseNotes: 'text' });
productSchema.virtual('discount').get(function () { return this.oldPrice && this.oldPrice > this.price ? Math.round((1 - this.price / this.oldPrice) * 100) : 0; });
productSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' }, brandName: { type: String, default: 'KATANA PARFUM' }, slogan: { type: String, default: 'Your Signature. Your Scent.' },
  supportEmail: { type: String, default: 'support@katanaparfum.cam' }, whatsapp: { type: String, default: '0778379244' }, currency: { type: String, default: 'DH' }, deliveryPrice: { type: Number, default: 0 }, freeDeliveryThreshold: { type: Number, default: 300 }, estimatedDelivery: { type: String, default: '2-4 أيام عمل' }, cities: [String], heroTitle: { type: String, default: 'اكتشف عطرك المميز' }, heroDescription: { type: String, default: 'عطور مختارة بعناية لتمنحك حضورًا لا يُنسى.' }, heroImage: { type: String, default: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1600&q=85' }, socialLinks: { instagram: String, facebook: String, tiktok: String }
}, { timestamps: true });
module.exports = mongoose.model('Settings', settingsSchema);

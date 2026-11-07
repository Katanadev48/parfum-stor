const mongoose = require('mongoose');
const schema = new mongoose.Schema({ email: { type: String, unique: true, lowercase: true }, status: { type: String, default: 'active' } }, { timestamps: true });
module.exports = mongoose.model('NewsletterSubscriber', schema);

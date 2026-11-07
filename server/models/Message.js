const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({ name: String, email: String, phone: String, subject: String, message: String, resolved: { type: Boolean, default: false } }, { timestamps: true });
module.exports = mongoose.model('Message', messageSchema);

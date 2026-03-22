const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: '' },
    receiverId: { type: String, required: true, index: true },
    receiverName: { type: String, default: '' },
    receiverAvatar: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);

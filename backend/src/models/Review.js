const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  tourist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  serviceType: { type: String, enum: ['hotel', 'vehicle', 'guide'], required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  reply: replySchema,
  isVisible: { type: Boolean, default: true },
  editableUntil: { type: Date } // set on create: createdAt + 24h
}, { timestamps: true });

// One review per booking per service
reviewSchema.index({ tourist: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

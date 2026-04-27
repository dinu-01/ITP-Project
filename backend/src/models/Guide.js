const mongoose = require('mongoose');

const tourPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  locations: [String],
  duration: { type: String, required: true }, // e.g. "1 Day", "3 Days"
  price: { type: Number, required: true, min: 0 },
  maxGroupSize: { type: Number, default: 10 },
  includes: [String],
  isActive: { type: Boolean, default: true }
});

const guideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: String,
  languages: [{ type: String, required: true }],
  areasServed: [String],
  pricePerDay: { type: Number, required: true, min: 0 },
  experience: { type: Number, default: 0 }, // years
  certifications: [String],
  profileImage: String, // base64
  tourPackages: [tourPackageSchema],
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Guide', guideSchema);

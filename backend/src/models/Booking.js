const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const bookingSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true },
  tourist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, enum: ['hotel', 'vehicle', 'guide', 'package'], required: true },
  // Service refs
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
  // Package booking (hotel+vehicle+guide)
  packageHotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  packageVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  packageGuide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
  // Package approval statuses (per provider)
  packageHotelStatus: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  packageVehicleStatus: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  packageGuideStatus: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  // Room type for hotel
  roomType: String,
  numberOfRooms: { type: Number, default: 1 },
  // Dates
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  // Status
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Advance Paid', 'Fully Paid', 'Refunded'], default: 'Unpaid' },
  totalPrice: { type: Number, default: 0 },
  specialRequests: String,
  numberOfGuests: { type: Number, default: 1 },
  // Provider (for easy query) - for packages, multiple providers
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // For package: array of provider IDs (hotel owner, vehicle owner, guide user)
  packageProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reminderSent1Day: { type: Boolean, default: false },
  reminderSentFewHours: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate reference number
bookingSchema.pre('save', async function(next) {
  if (this.referenceNumber) return next();
  const prefixMap = { hotel: 'HOT', vehicle: 'VEH', guide: 'GUI', package: 'PKG' };
  const prefix = prefixMap[this.serviceType] || 'BKG';
  const year = new Date().getFullYear();
  const counter = await Counter.findByIdAndUpdate(
    `booking_${this.serviceType}`,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  this.referenceNumber = `${prefix}-${year}-${String(counter.seq).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);

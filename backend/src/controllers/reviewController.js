const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Vehicle = require('../models/Vehicle');
const Guide = require('../models/Guide');

const updateServiceRating = async (serviceType, serviceId) => {
  const field = serviceType === 'hotel' ? 'hotel' : serviceType === 'vehicle' ? 'vehicle' : 'guide';
  const reviews = await Review.find({ [field]: serviceId, isVisible: true });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const Model = serviceType === 'hotel' ? Hotel : serviceType === 'vehicle' ? Vehicle : Guide;
  await Model.findByIdAndUpdate(serviceId, { averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
};

exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.tourist.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status !== 'Completed') return res.status(400).json({ success: false, message: 'Can only review completed bookings' });

    const existing = await Review.findOne({ tourist: req.user._id, booking: bookingId });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed this booking' });

    const serviceType = booking.serviceType === 'package' ? 'hotel' : booking.serviceType;
    const serviceId = booking.hotel || booking.vehicle || booking.guide;

    const editableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const review = await Review.create({
      tourist: req.user._id, booking: bookingId, serviceType,
      [serviceType]: serviceId, rating, comment, editableUntil
    });

    await updateServiceRating(serviceType, serviceId);
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getServiceReviews = async (req, res) => {
  try {
    const { serviceType, serviceId } = req.params;
    const { sort = 'recent', minRating, page = 1, limit = 10 } = req.query;

    const filter = { [serviceType]: serviceId, isVisible: true };
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const sortMap = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1 },
      lowest: { rating: 1 }
    };

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('tourist', 'name profilePicture')
        .populate('reply.provider', 'name')
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Review.countDocuments(filter)
    ]);
    res.json({ success: true, reviews, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.tourist.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (review.editableUntil && new Date() > review.editableUntil) return res.status(400).json({ success: false, message: 'Edit window expired (24 hours)' });
    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    await review.save();
    await updateServiceRating(review.serviceType, review[review.serviceType]);
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    const isOwner = review.tourist.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });
    const serviceId = review[review.serviceType];
    const serviceType = review.serviceType;
    await review.deleteOne();
    await updateServiceRating(serviceType, serviceId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.replyToReview = async (req, res) => {
  try {
    const { comment } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.reply = { provider: req.user._id, comment };
    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tourist: req.user._id })
      .populate('hotel', 'name').populate('vehicle', 'brand model').populate({ path: 'guide', populate: { path: 'user', select: 'name' } })
      .sort('-createdAt');
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

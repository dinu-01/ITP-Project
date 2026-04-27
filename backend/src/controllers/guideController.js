const Guide = require('../models/Guide');
const Booking = require('../models/Booking');

exports.createGuide = async (req, res) => {
  try {
    const existing = await Guide.findOne({ user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Guide profile already exists' });
    const guide = await Guide.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, guide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGuides = async (req, res) => {
  try {
    const { language, area, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };
    if (language) filter.languages = { $in: [language] };
    if (area) filter.areasServed = { $regex: area, $options: 'i' };
    if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: Number(minPrice) };
    if (maxPrice) filter.pricePerDay = { ...filter.pricePerDay, $lte: Number(maxPrice) };
    const skip = (page - 1) * limit;
    const [guides, total] = await Promise.all([
      Guide.find(filter).populate('user', 'name email phone').skip(skip).limit(Number(limit)).sort('-createdAt'),
      Guide.countDocuments(filter)
    ]);
    res.json({ success: true, guides, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id).populate('user', 'name email phone');
    if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });
    res.json({ success: true, guide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyGuideProfile = async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!guide) return res.status(404).json({ success: false, message: 'Guide profile not found' });
    res.json({ success: true, guide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateGuide = async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) return res.status(404).json({ success: false, message: 'Guide profile not found' });
    Object.assign(guide, req.body);
    await guide.save();
    res.json({ success: true, guide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) return res.status(404).json({ success: false, message: 'Guide profile not found' });
    guide.isActive = false;
    await guide.save();
    res.json({ success: true, message: 'Guide profile deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tour Package CRUD
exports.addTourPackage = async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) return res.status(404).json({ success: false, message: 'Guide profile not found' });
    guide.tourPackages.push(req.body);
    await guide.save();
    res.status(201).json({ success: true, tourPackages: guide.tourPackages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTourPackage = async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) return res.status(404).json({ success: false, message: 'Guide profile not found' });
    const pkg = guide.tourPackages.id(req.params.pkgId);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    Object.assign(pkg, req.body);
    await guide.save();
    res.json({ success: true, tourPackages: guide.tourPackages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTourPackage = async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) return res.status(404).json({ success: false, message: 'Guide profile not found' });
    guide.tourPackages = guide.tourPackages.filter(p => p._id.toString() !== req.params.pkgId);
    await guide.save();
    res.json({ success: true, tourPackages: guide.tourPackages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { guideId, startDate, endDate } = req.body;
    const guide = await Guide.findById(guideId);
    if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });
    const overlapping = await Booking.findOne({
      guide: guideId,
      status: { $in: ['Pending', 'Confirmed'] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });
    res.json({ success: true, available: !overlapping });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

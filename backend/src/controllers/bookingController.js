const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Vehicle = require('../models/Vehicle');
const Guide = require('../models/Guide');
const User = require('../models/User');
const { generateBookingPDF } = require('../utils/pdfService');
const { sendBookingConfirmation, sendBookingStatusUpdate, sendEmail } = require('../utils/emailService');

const getProviderEmail = async (booking) => {
  try {
    if (booking.serviceType === 'hotel' && booking.hotel) {
      const h = await Hotel.findById(booking.hotel).populate('owner', 'email');
      return h?.owner?.email;
    }
    if (booking.serviceType === 'vehicle' && booking.vehicle) {
      const v = await Vehicle.findById(booking.vehicle).populate('owner', 'email');
      return v?.owner?.email;
    }
    if (booking.serviceType === 'guide' && booking.guide) {
      const g = await Guide.findById(booking.guide).populate('user', 'email');
      return g?.user?.email;
    }
  } catch { return null; }
};

exports.createBooking = async (req, res) => {
  try {
    const { serviceType, hotelId, vehicleId, guideId, roomType, numberOfRooms, startDate, endDate, numberOfGuests, specialRequests, paymentStatus,
      packageHotel, packageVehicle, packageGuide } = req.body;

    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Start and end dates required' });
    if (new Date(startDate) >= new Date(endDate)) return res.status(400).json({ success: false, message: 'End date must be after start date' });
    if (new Date(startDate) < new Date()) return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    let totalPrice = 0;
    let provider = null;

    const bookingData = {
      tourist: req.user._id,
      serviceType,
      startDate,
      endDate,
      numberOfGuests: numberOfGuests || 1,
      specialRequests,
      paymentStatus: paymentStatus || 'Unpaid'
    };

    if (serviceType === 'hotel') {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
      // Check availability
      const overlapping = await Booking.countDocuments({
        hotel: hotelId, roomType,
        status: { $in: ['Pending', 'Confirmed'] },
        startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) }
      });
      const room = hotel.roomTypes.find(r => r.type === roomType);
      if (!room) return res.status(400).json({ success: false, message: 'Room type not found' });
      if (overlapping >= room.totalRooms) return res.status(400).json({ success: false, message: 'No rooms available for selected dates' });
      totalPrice = room.price * days * (numberOfRooms || 1);
      bookingData.hotel = hotelId;
      bookingData.roomType = roomType;
      bookingData.numberOfRooms = numberOfRooms || 1;
      provider = hotel.owner;

    } else if (serviceType === 'vehicle') {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      const overlap = await Booking.findOne({
        vehicle: vehicleId, status: { $in: ['Pending', 'Confirmed'] },
        startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) }
      });
      if (overlap) return res.status(400).json({ success: false, message: 'Vehicle not available for selected dates' });
      totalPrice = vehicle.pricePerDay * days;
      bookingData.vehicle = vehicleId;
      provider = vehicle.owner;

    } else if (serviceType === 'guide') {
      const guide = await Guide.findById(guideId);
      if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });
      const overlap = await Booking.findOne({
        guide: guideId, status: { $in: ['Pending', 'Confirmed'] },
        startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) }
      });
      if (overlap) return res.status(400).json({ success: false, message: 'Guide not available for selected dates' });
      totalPrice = guide.pricePerDay * days;
      bookingData.guide = guideId;
      provider = guide.user;

    } else if (serviceType === 'package') {
      // All-in-one package
      let pTotal = 0;
      const packageProviderIds = [];
      if (packageHotel) {
        const hotel = await Hotel.findById(packageHotel);
        if (hotel) { if (hotel.roomTypes.length > 0) pTotal += hotel.roomTypes[0].price * days; packageProviderIds.push(hotel.owner); }
        bookingData.packageHotel = packageHotel;
      }
      if (packageVehicle) {
        const vehicle = await Vehicle.findById(packageVehicle);
        if (vehicle) { pTotal += vehicle.pricePerDay * days; packageProviderIds.push(vehicle.owner); }
        bookingData.packageVehicle = packageVehicle;
      }
      if (packageGuide) {
        const guide = await Guide.findById(packageGuide);
        if (guide) { pTotal += guide.pricePerDay * days; packageProviderIds.push(guide.user); }
        bookingData.packageGuide = packageGuide;
      }
      totalPrice = pTotal;
      bookingData.packageProviders = packageProviderIds.filter(Boolean);
    }

    bookingData.totalPrice = totalPrice;
    bookingData.provider = provider;

    const booking = await Booking.create(bookingData);
    const tourist = await User.findById(req.user._id);
    const providerEmail = await getProviderEmail(booking);
    await sendBookingConfirmation(booking, tourist, providerEmail);

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { tourist: req.user._id };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('hotel', 'name location images')
        .populate('vehicle', 'brand model type images')
        .populate('guide', 'user bio')
        .populate({ path: 'guide', populate: { path: 'user', select: 'name' } })
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Booking.countDocuments(filter)
    ]);
    res.json({ success: true, bookings, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProviderBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    // Include package bookings where this user is one of the package providers
    const filter = { $or: [{ provider: req.user._id }, { packageProviders: req.user._id }] };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('tourist', 'name email phone')
        .populate('hotel', 'name location address phone')
        .populate('vehicle', 'brand model type registrationNumber')
        .populate({ path: 'packageHotel', select: 'name location' })
        .populate({ path: 'packageVehicle', select: 'brand model type' })
        .populate({ path: 'packageGuide', populate: { path: 'user', select: 'name' } })
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Booking.countDocuments(filter)
    ]);
    res.json({ success: true, bookings, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tourist', 'name email phone')
      .populate('hotel', 'name location address phone mapLink')
      .populate('vehicle', 'brand model type registrationNumber')
      .populate({ path: 'guide', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'packageHotel', select: 'name location address phone mapLink' })
      .populate({ path: 'packageVehicle', select: 'brand model type registrationNumber' })
      .populate({ path: 'packageGuide', populate: { path: 'user', select: 'name email phone' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const isOwner = booking.tourist._id.toString() === req.user._id.toString();
    const isProvider = booking.provider?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isProvider && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isProvider = booking.provider?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isProvider && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    await booking.save();

    const tourist = await User.findById(booking.tourist);
    await sendBookingStatusUpdate(booking, tourist);
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.tourist.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status !== 'Pending') return res.status(400).json({ success: false, message: 'Can only cancel pending bookings' });
    booking.status = 'Cancelled';
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBookingDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.tourist.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status !== 'Pending') return res.status(400).json({ success: false, message: 'Can only modify pending bookings' });
    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadBookingPDF = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tourist', 'name email')
      .populate('hotel', 'name location address phone')
      .populate('vehicle', 'brand model type registrationNumber')
      .populate({ path: 'guide', populate: { path: 'user', select: 'name email phone' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const isOwner = booking.tourist._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });

    let serviceDetails = {};
    if (booking.hotel) serviceDetails = { 'Hotel': booking.hotel.name, 'Location': booking.hotel.location, 'Room Type': booking.roomType };
    if (booking.vehicle) serviceDetails = { 'Vehicle': `${booking.vehicle.brand} ${booking.vehicle.model}`, 'Type': booking.vehicle.type, 'Reg No': booking.vehicle.registrationNumber };
    if (booking.guide) serviceDetails = { 'Guide': booking.guide.user?.name, 'Email': booking.guide.user?.email };

    const pdf = await generateBookingPDF(booking, booking.tourist, serviceDetails);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=booking-${booking.referenceNumber}.pdf`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Package sub-status approval by individual provider
exports.approvePackageComponent = async (req, res) => {
  try {
    const { componentStatus } = req.body; // 'Confirmed' or 'Cancelled'
    const booking = await Booking.findById(req.params.id)
      .populate('packageHotel', 'owner')
      .populate('packageVehicle', 'owner')
      .populate('packageGuide', 'user');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.serviceType !== 'package') return res.status(400).json({ success: false, message: 'Not a package booking' });

    const uid = req.user._id.toString();

    // Determine which component this provider owns
    let updated = false;
    if (booking.packageHotel?.owner?.toString() === uid) {
      booking.packageHotelStatus = componentStatus;
      updated = true;
    }
    if (booking.packageVehicle?.owner?.toString() === uid) {
      booking.packageVehicleStatus = componentStatus;
      updated = true;
    }
    if (booking.packageGuide?.user?.toString() === uid) {
      booking.packageGuideStatus = componentStatus;
      updated = true;
    }
    if (!updated && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this package' });
    }

    // Auto-update overall status
    const statuses = [];
    if (booking.packageHotel) statuses.push(booking.packageHotelStatus);
    if (booking.packageVehicle) statuses.push(booking.packageVehicleStatus);
    if (booking.packageGuide) statuses.push(booking.packageGuideStatus);

    if (statuses.every(s => s === 'Confirmed')) booking.status = 'Confirmed';
    else if (statuses.some(s => s === 'Cancelled')) booking.status = 'Cancelled';
    else booking.status = 'Pending';

    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

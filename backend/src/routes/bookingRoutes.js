const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getProviderBookings, getBooking, updateBookingStatus, cancelBooking, updateBookingDates, downloadBookingPDF, approvePackageComponent } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Specific named routes BEFORE /:id param
router.post('/', authorize('tourist'), createBooking);
router.get('/my', getMyBookings);
router.get('/provider', authorize('hotel_owner', 'vehicle_owner', 'guide', 'admin'), getProviderBookings);

// Param routes last
router.get('/:id', getBooking);
router.put('/:id/status', authorize('hotel_owner', 'vehicle_owner', 'guide', 'admin'), updateBookingStatus);
router.put('/:id/package-approve', authorize('hotel_owner', 'vehicle_owner', 'guide', 'admin'), approvePackageComponent);
router.put('/:id/cancel', authorize('tourist'), cancelBooking);
router.put('/:id/dates', authorize('tourist'), updateBookingDates);
router.get('/:id/pdf', downloadBookingPDF);

module.exports = router;

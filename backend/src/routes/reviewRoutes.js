const express = require('express');
const router = express.Router();
const { createReview, getServiceReviews, updateReview, deleteReview, replyToReview, getMyReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// NOTE: /my defined first - avoids collision with /:serviceType/:serviceId
router.get('/my', protect, getMyReviews);
router.post('/', protect, authorize('tourist'), createReview);
router.put('/:id', protect, authorize('tourist'), updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/reply', protect, authorize('hotel_owner', 'vehicle_owner', 'guide', 'admin'), replyToReview);

// Public - must be last
router.get('/:serviceType/:serviceId', getServiceReviews);

module.exports = router;

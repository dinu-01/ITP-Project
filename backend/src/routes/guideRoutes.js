const express = require('express');
const router = express.Router();
const { createGuide, getGuides, getGuide, getMyGuideProfile, updateGuide, deleteGuide, addTourPackage, updateTourPackage, deleteTourPackage, checkAvailability } = require('../controllers/guideController');
const { protect, authorize, requireApproval } = require('../middleware/auth');

// Public routes
router.get('/', getGuides);
router.post('/check-availability', checkAvailability);

// Protected specific routes BEFORE /:id param
router.get('/my/profile', protect, authorize('guide', 'admin'), getMyGuideProfile);
router.post('/my/packages', protect, authorize('guide', 'admin'), addTourPackage);
router.put('/my/packages/:pkgId', protect, authorize('guide', 'admin'), updateTourPackage);
router.delete('/my/packages/:pkgId', protect, authorize('guide', 'admin'), deleteTourPackage);
router.post('/', protect, authorize('guide', 'admin'), requireApproval, createGuide);
router.put('/my/profile', protect, authorize('guide', 'admin'), requireApproval, updateGuide);
router.delete('/my/profile', protect, authorize('guide', 'admin'), deleteGuide);

// Param routes last
router.get('/:id', getGuide);

module.exports = router;

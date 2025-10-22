const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/media/upload
// @desc    Upload single image
// @access  Private (TEMPORARY - All authenticated users)
router.post(
  '/upload',
  authenticate,
  // authorize('admin'),  // TEMPORARILY DISABLED FOR TESTING
  mediaController.uploadSingle,
  mediaController.handleSingleUpload
);

// @route   POST /api/media/upload-multiple
// @desc    Upload multiple images
// @access  Private (TEMPORARY - All authenticated users)
router.post(
  '/upload-multiple',
  authenticate,
  // authorize('admin'),  // TEMPORARILY DISABLED FOR TESTING
  mediaController.uploadMultiple,
  mediaController.handleMultipleUpload
);

// @route   GET /api/media
// @desc    Get all media files
// @access  Private (All authenticated users can view)
router.get('/', authenticate, mediaController.getAllMedia);

// @route   GET /api/media/:id
// @desc    Get media file details
// @access  Private (All authenticated users can view)
router.get('/:id', authenticate, mediaController.getMediaDetails);

// @route   DELETE /api/media/:id
// @desc    Delete media file
// @access  Private (TEMPORARY - All authenticated users)
router.delete('/:id', authenticate, mediaController.deleteMedia);
// TODO: Re-enable admin check after testing: authorize('admin')

module.exports = router;

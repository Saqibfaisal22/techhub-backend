const multer = require('multer');
const path = require('path');
const { s3, upload, uploadToS3 } = require('../config/s3');
const { Media } = require('../models');

// Multer upload instance with S3
const uploadSingle = upload.single('image');

const uploadMultiple = upload.array('images', 10);

// Upload single image
exports.uploadSingle = uploadSingle;

// Upload multiple images
exports.uploadMultiple = uploadMultiple;

// Handle single file upload
exports.handleSingleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to S3
    const s3Result = await uploadToS3(req.file);
    const fileUrl = s3Result.location;

    // Save to database
    const media = await Media.create({
      filename: s3Result.key,
      original_name: req.file.originalname,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: media.id,
        filename: s3Result.key,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        uploadedAt: media.created_at
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};// Handle multiple files upload
exports.handleMultipleUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Save each file to database
    const uploadedFiles = [];
    for (const file of req.files) {
      // Upload to S3
      const s3Result = await uploadToS3(file);
      const fileUrl = s3Result.location;

      const media = await Media.create({
        filename: s3Result.key,
        original_name: file.originalname,
        url: fileUrl,
        mimetype: file.mimetype,
        size: file.size,
      });
      uploadedFiles.push({
        id: media.id,
        filename: s3Result.key,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
        uploadedAt: media.created_at
      });
    }

    res.status(201).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
};

// Get all media files
exports.getAllMedia = async (req, res) => {
  try {
    const mediaFiles = await Media.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: mediaFiles.length,
      data: mediaFiles
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media files',
      error: error.message
    });
  }
};

// Delete media file
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Media ID is required'
      });
    }

    const media = await Media.findByPk(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Delete from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: media.filename
    };
    await s3.deleteObject(params).promise();

    // Delete from DB
    await media.destroy();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

// Get media file details
exports.getMediaDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Media ID is required'
      });
    }

    const media = await Media.findByPk(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('Error fetching file details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file details',
      error: error.message
    });
  }
};

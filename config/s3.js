const AWS = require('aws-sdk');
const multer = require('multer');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create S3 instance
const s3 = new AWS.S3();

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
};

// Custom multer storage for S3
const s3Storage = multer.memoryStorage();

// Upload function
const uploadToS3 = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const key = 'uploads/' + uniqueSuffix + '-' + file.originalname;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read' // Temporarily removed
  };

  const result = await s3.upload(params).promise();
  return {
    key: key,
    location: result.Location,
    bucket: result.Bucket
  };
};

// Multer upload instance
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: imageFilter
});

module.exports = { s3, upload, uploadToS3 };
// ===========================================
// File Upload Middleware (Multer)
// Handles image uploads for tickets and resolutions
// ===========================================

const multer = require('multer');
const path = require('path');
const { sendError } = require('../utils/helpers');

// Storage configuration — saves files to /uploads with unique names
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

if (!process.env.CLOUDINARY_URL) {
  console.error('\n❌ CRITICAL ERROR: CLOUDINARY_URL is missing in .env');
  console.error('   Cloudinary is required for image uploads. Please add it to continue.\n');
  process.exit(1);
}

// Production & Local: Always use Cloudinary
storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'urban-resolve',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `${file.fieldname}-${uniqueSuffix}`;
    },
  },
});

// File filter — only allow JPEG and PNG images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'), false);
  }
};

// Multer instance with size limit (10MB)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

/**
 * Error handler middleware for multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum size is 10MB.', 400, 'FILE_TOO_LARGE');
    }
    return sendError(res, `Upload error: ${err.message}`, 400, 'UPLOAD_ERROR');
  }
  if (err) {
    return sendError(res, err.message, 400, 'UPLOAD_ERROR');
  }
  next();
};

module.exports = { upload, handleUploadError };

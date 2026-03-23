// ===========================================
// File Upload Middleware (Multer)
// Handles image uploads for tickets and resolutions
// ===========================================

const multer = require('multer');
const path = require('path');
const { sendError } = require('../utils/helpers');

// Storage configuration — saves files to /uploads with unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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

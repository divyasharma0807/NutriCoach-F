import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage for files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(__dirname, '../uploads/tmp/');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedPdfTypes = /pdf/;

  const extname = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'medicalPdf') {
    // Only PDF allowed
    const isPdf = allowedPdfTypes.test(extname) && file.mimetype === 'application/pdf';
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for medical records!'), false);
    }
  } else {
    // Images allowed
    const isImage = allowedImageTypes.test(extname) && file.mimetype.startsWith('image/');
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
    }
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export default upload;

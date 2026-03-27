const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProspects,
  createProspect,
  updateProspect,
  deleteProspect,
  getProspectStats,
  importProspectsFromExcel,
  exportProspectsToExcel,
} = require('../controllers/prospectController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed (.xlsx, .xls)'));
    }
  },
});

const uploadImportFile = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size must be less than 5MB' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(400).json({ success: false, message: error.message });
  });
};

router.get('/stats', protect, getProspectStats);
router.get('/export', protect, authorize('admin'), exportProspectsToExcel);
router.post('/import', protect, authorize('admin'), uploadImportFile, importProspectsFromExcel);
router.route('/').get(protect, getProspects).post(protect, createProspect);
router.route('/:id').put(protect, updateProspect).delete(protect, authorize('admin'), deleteProspect);

module.exports = router;

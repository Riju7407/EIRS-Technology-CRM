const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addPurchase,
  updatePurchaseStatus,
  getClientStats,
  importClientsFromExcel,
  exportClientsToExcel,
} = require('../controllers/clientController');
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

// Stats route MUST come before /:id routes
router.get('/stats', protect, getClientStats);
router.get('/export', protect, authorize('admin'), exportClientsToExcel);
router.post('/import', protect, authorize('admin'), uploadImportFile, importClientsFromExcel);

router.route('/').get(protect, getClients).post(protect, createClient);

// More specific nested routes MUST come before /:id route
router.post('/:id/purchase', protect, addPurchase);
router.put('/:id/purchase/:purchaseIndex', protect, updatePurchaseStatus);

// Generic :id route comes last
router
  .route('/:id')
  .get(protect, getClientById)
  .put(protect, updateClient)
  .delete(protect, authorize('admin'), deleteClient);

module.exports = router;

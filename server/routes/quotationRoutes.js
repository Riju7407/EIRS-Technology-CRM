const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create a new quotation
router.post('/', quotationController.createQuotation);

// Get all quotations with filters and pagination
router.get('/', quotationController.getQuotations);

// Get a specific quotation
router.get('/:id', quotationController.getQuotationById);

// Update quotation status
router.patch('/:id/status', quotationController.updateQuotationStatus);

// Download quotation PDF
router.get('/:id/download', quotationController.downloadQuotationPdf);

// Delete a quotation
router.delete('/:id', quotationController.deleteQuotation);

module.exports = router;

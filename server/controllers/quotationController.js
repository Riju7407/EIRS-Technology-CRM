const Quotation = require('../models/Quotation');
const Client = require('../models/Client');

// Save a new quotation
exports.createQuotation = async (req, res) => {
  try {
    const { quoteNumber, clientId, items, discount, taxPercent, notes, subtotal, taxAmount, total, pdfData } = req.body;
    const userId = req.user._id;

    // Get client details
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const quotation = new Quotation({
      quoteNumber,
      clientId,
      clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
      clientPhone: client.phone,
      clientAddress: [
        client.address?.street,
        client.address?.city,
        client.address?.state,
        client.address?.zipCode,
      ]
        .filter(Boolean)
        .join(', '),
      items,
      discount,
      taxPercent,
      notes,
      subtotal,
      taxAmount,
      total,
      pdfData,
      createdBy: userId,
    });

    await quotation.save();
    res.status(201).json({ message: 'Quotation saved successfully', quotation });
  } catch (error) {
    console.error('Error saving quotation:', error);
    res.status(500).json({ message: 'Failed to save quotation', error: error.message });
  }
};

// Get all quotations with filters and pagination
exports.getQuotations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;
    if (search) {
      filter.$or = [
        { quoteNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Quotation.countDocuments(filter);
    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('clientId', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      quotations,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
  }
};

// Get a single quotation by ID
exports.getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id)
      .populate('clientId')
      .populate('createdBy', 'firstName lastName email');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ message: 'Failed to fetch quotation', error: error.message });
  }
};

// Update quotation status
exports.updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const quotation = await Quotation.findByIdAndUpdate(id, { status }, { new: true });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ message: 'Quotation status updated', quotation });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Failed to update quotation', error: error.message });
  }
};

// Delete a quotation
exports.deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findByIdAndDelete(id);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ message: 'Failed to delete quotation', error: error.message });
  }
};

// Download quotation PDF
exports.downloadQuotationPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Generate PDF with stored data
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pdfData = quotation.pdfData || generatePdfContent(quotation);

    // Apply the PDF data (this would need to be re-rendered from stored data)
    // For now, sending file with headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quoteNumber}.pdf"`);

    // In a real implementation, regenerate PDF from stored quotation data
    res.json({
      message: 'PDF download initiated',
      quotationNumber: quotation.quoteNumber,
      data: quotation,
    });
  } catch (error) {
    console.error('Error downloading quotation:', error);
    res.status(500).json({ message: 'Failed to download quotation', error: error.message });
  }
};

// Helper function to generate PDF content from quotation data
function generatePdfContent(quotation) {
  return {
    quoteNumber: quotation.quoteNumber,
    clientName: quotation.clientName,
    items: quotation.items,
    total: quotation.total,
  };
}

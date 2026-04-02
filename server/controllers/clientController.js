const Client = require('../models/Client');
const XLSX = require('xlsx');

const VALID_STATUSES = ['active', 'inactive', 'lead', 'prospect', 'churned'];
const VALID_SOURCES = ['referral', 'website', 'social_media', 'cold_call', 'market', 'other'];

const toSafeString = (value) => (value === undefined || value === null ? '' : String(value).trim());
const toLower = (value) => toSafeString(value).toLowerCase();

const normalizeStatus = (value) => {
  const status = toLower(value);
  return VALID_STATUSES.includes(status) ? status : 'lead';
};

const normalizeSource = (value) => {
  const source = toLower(value).replace(/[\s-]+/g, '_');
  return VALID_SOURCES.includes(source) ? source : 'other';
};

const splitName = (name) => {
  const normalized = toSafeString(name);
  if (!normalized) return { firstName: '', lastName: '' };

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const mapExcelRowToClient = (row) => {
  const firstName = toSafeString(row.firstName || row['First Name']);
  const lastName = toSafeString(row.lastName || row['Last Name']);
  const fullName = toSafeString(row.name || row.Name);
  const nameParts = splitName(fullName);

  return {
    firstName: firstName || nameParts.firstName,
    lastName: lastName || nameParts.lastName,
    email: toLower(row.email || row.Email),
    phone: toSafeString(row.phone || row.Phone),
    alternatePhone: toSafeString(row.alternatePhone || row['Alternate Phone']),
    company: toSafeString(row.company || row.Company),
    status: normalizeStatus(row.status || row.Status),
    source: normalizeSource(row.source || row.Source),
    notes: toSafeString(row.notes || row.Notes),
    tags: toSafeString(row.tags || row.Tags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
};

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 10, assignedTo } = req.query;
    const query = { isDeleted: false };

    if (status) query.status = status;
    if (source) query.source = source;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('assignedTo', 'name email role region')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: clients.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      clients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name email role');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body });
    res.status(201).json({ success: true, message: 'Client created successfully', client });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Client with this email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, message: 'Client updated successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client (soft delete)
// @route   DELETE /api/clients/:id
// @access  Private/Admin
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add purchase to client
// @route   POST /api/clients/:id/purchase
// @access  Private
exports.addPurchase = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    client.purchaseHistory.push(req.body);
    await client.save();
    res.status(201).json({ success: true, message: 'Purchase added', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update purchase status in client
// @route   PUT /api/clients/:id/purchase/:purchaseIndex
// @access  Private
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { id, purchaseIndex } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const client = await Client.findOne({ _id: id, isDeleted: false });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const index = parseInt(purchaseIndex);
    if (index < 0 || index >= client.purchaseHistory.length) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    client.purchaseHistory[index].status = status;
    await client.save();

    res.status(200).json({
      success: true,
      message: 'Purchase status updated',
      purchase: client.purchaseHistory[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get client stats (dashboard)
// @route   GET /api/clients/stats
// @access  Private
exports.getClientStats = async (req, res) => {
  try {
    const total = await Client.countDocuments({ isDeleted: false });
    const active = await Client.countDocuments({ isDeleted: false, status: 'active' });
    const leads = await Client.countDocuments({ isDeleted: false, status: 'lead' });
    const churned = await Client.countDocuments({ isDeleted: false, status: 'churned' });

    const recentClients = await Client.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email status createdAt');

    res.status(200).json({
      success: true,
      stats: { total, active, leads, churned },
      recentClients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import clients from Excel
// @route   POST /api/clients/import
// @access  Private/Admin
exports.importClientsFromExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Excel file is required' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) {
      return res.status(400).json({ success: false, message: 'Excel file has no sheets' });
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Excel sheet is empty' });
    }

    let created = 0;
    let updated = 0;
    const skipped = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const payload = mapExcelRowToClient(row);

      if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
        skipped.push({ row: index + 2, reason: 'Missing required fields: firstName, lastName, email or phone' });
        continue;
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(payload.email)) {
        skipped.push({ row: index + 2, reason: 'Invalid email format' });
        continue;
      }

      const existingClient = await Client.findOne({ email: payload.email });
      if (existingClient) {
        const updatePayload = {
          ...payload,
          isDeleted: false,
          tags: payload.tags.length ? payload.tags : existingClient.tags,
          alternatePhone: payload.alternatePhone || existingClient.alternatePhone,
          company: payload.company || existingClient.company,
          notes: payload.notes || existingClient.notes,
        };
        await Client.findByIdAndUpdate(existingClient._id, updatePayload, { runValidators: true });
        updated += 1;
      } else {
        await Client.create(payload);
        created += 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Client import completed',
      summary: {
        totalRows: rows.length,
        created,
        updated,
        skipped: skipped.length,
      },
      skipped,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export clients to Excel
// @route   GET /api/clients/export
// @access  Private/Admin
exports.exportClientsToExcel = async (req, res) => {
  try {
    const clients = await Client.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

    const excelRows = clients.map((client) => ({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      alternatePhone: client.alternatePhone || '',
      company: client.company || '',
      status: client.status,
      source: client.source,
      totalPurchaseValue: client.totalPurchaseValue || 0,
      notes: client.notes || '',
      tags: Array.isArray(client.tags) ? client.tags.join(', ') : '',
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `clients-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(fileBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const Prospect = require('../models/Prospect');
const XLSX = require('xlsx');

const VALID_STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const VALID_SOURCES = ['referral', 'website', 'social_media', 'cold_call', 'market', 'other'];

const toSafeString = (value) => (value === undefined || value === null ? '' : String(value).trim());
const toLower = (value) => toSafeString(value).toLowerCase();

const normalizeStage = (value) => {
  const stage = toLower(value);
  return VALID_STAGES.includes(stage) ? stage : 'new';
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

const mapExcelRowToProspect = (row) => {
  const firstName = toSafeString(row.firstName || row['First Name']);
  const lastName = toSafeString(row.lastName || row['Last Name']);
  const fullName = toSafeString(row.name || row.Name);
  const nameParts = splitName(fullName);

  const estimatedValueRaw = row.estimatedValue || row['Estimated Value'] || 0;
  const estimatedValue = Number(estimatedValueRaw);

  return {
    firstName: firstName || nameParts.firstName,
    lastName: lastName || nameParts.lastName,
    email: toLower(row.email || row.Email),
    phone: toSafeString(row.phone || row.Phone),
    company: toSafeString(row.company || row.Company),
    stage: normalizeStage(row.stage || row.Stage),
    source: normalizeSource(row.source || row.Source),
    estimatedValue: Number.isFinite(estimatedValue) ? estimatedValue : 0,
    notes: toSafeString(row.notes || row.Notes),
  };
};

// @desc    Get all prospects
// @route   GET /api/prospects
// @access  Private
exports.getProspects = async (req, res) => {
  try {
    const { stage, source, search, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: false };

    if (stage) query.stage = stage;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Prospect.countDocuments(query);
    const prospects = await Prospect.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: prospects.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      prospects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create prospect
// @route   POST /api/prospects
// @access  Private
exports.createProspect = async (req, res) => {
  try {
    const prospect = await Prospect.create({ ...req.body });
    res.status(201).json({ success: true, message: 'Prospect created successfully', prospect });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update prospect
// @route   PUT /api/prospects/:id
// @access  Private
exports.updateProspect = async (req, res) => {
  try {
    const prospect = await Prospect.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found' });
    }

    res.status(200).json({ success: true, message: 'Prospect updated successfully', prospect });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete prospect (soft delete)
// @route   DELETE /api/prospects/:id
// @access  Private/Admin
exports.deleteProspect = async (req, res) => {
  try {
    const prospect = await Prospect.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found' });
    }

    res.status(200).json({ success: true, message: 'Prospect deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prospect stats
// @route   GET /api/prospects/stats
// @access  Private
exports.getProspectStats = async (req, res) => {
  try {
    const total = await Prospect.countDocuments({ isDeleted: false });
    const qualified = await Prospect.countDocuments({ isDeleted: false, stage: 'qualified' });
    const negotiation = await Prospect.countDocuments({ isDeleted: false, stage: 'negotiation' });
    const won = await Prospect.countDocuments({ isDeleted: false, stage: 'won' });

    const byStage = await Prospect.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$estimatedValue' } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: { total, qualified, negotiation, won },
      byStage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import prospects from Excel
// @route   POST /api/prospects/import
// @access  Private/Admin
exports.importProspectsFromExcel = async (req, res) => {
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
      const payload = mapExcelRowToProspect(row);

      if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
        skipped.push({ row: index + 2, reason: 'Missing required fields: firstName, lastName, email or phone' });
        continue;
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(payload.email)) {
        skipped.push({ row: index + 2, reason: 'Invalid email format' });
        continue;
      }

      const existingProspect = await Prospect.findOne({ email: payload.email });
      if (existingProspect) {
        const updatePayload = {
          ...payload,
          isDeleted: false,
          company: payload.company || existingProspect.company,
          notes: payload.notes || existingProspect.notes,
        };
        await Prospect.findByIdAndUpdate(existingProspect._id, updatePayload, { runValidators: true });
        updated += 1;
      } else {
        await Prospect.create(payload);
        created += 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Prospect import completed',
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

// @desc    Export prospects to Excel
// @route   GET /api/prospects/export
// @access  Private/Admin
exports.exportProspectsToExcel = async (req, res) => {
  try {
    const prospects = await Prospect.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

    const excelRows = prospects.map((prospect) => ({
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone,
      company: prospect.company || '',
      stage: prospect.stage,
      source: prospect.source,
      estimatedValue: prospect.estimatedValue || 0,
      notes: prospect.notes || '',
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects');

    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `prospects-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(fileBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

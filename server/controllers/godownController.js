const Godown = require('../models/Godown');

exports.getGodowns = async (req, res) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Godown.countDocuments(query);
    const godowns = await Godown.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ success: true, count: godowns.length, total, totalPages: Math.ceil(total / limit), currentPage: Number(page), godowns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGodown = async (req, res) => {
  try {
    const godown = await Godown.create(req.body);
    res.status(201).json({ success: true, message: 'Godown created successfully', godown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGodown = async (req, res) => {
  try {
    const godown = await Godown.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!godown) {
      return res.status(404).json({ success: false, message: 'Godown not found' });
    }
    res.status(200).json({ success: true, message: 'Godown updated successfully', godown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGodown = async (req, res) => {
  try {
    const godown = await Godown.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!godown) {
      return res.status(404).json({ success: false, message: 'Godown not found' });
    }
    res.status(200).json({ success: true, message: 'Godown deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
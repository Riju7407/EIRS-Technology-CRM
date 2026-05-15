const Item = require('../models/Item');

exports.getItems = async (req, res) => {
  try {
    const { search, itemType, category, page = 1, limit = 100 } = req.query;
    const query = { isDeleted: false };

    if (itemType) query.itemType = itemType;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
        { serviceCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Item.countDocuments(query);
    const items = await Item.find(query)
      .populate('godown', 'name city state')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ success: true, count: items.length, total, totalPages: Math.ceil(total / limit), currentPage: Number(page), items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const payload = { ...req.body };
    const item = await Item.create(payload);
    const populated = await Item.findById(item._id).populate('godown', 'name city state');
    res.status(201).json({ success: true, message: 'Item created successfully', item: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true }).populate('godown', 'name city state');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getItemStats = async (req, res) => {
  try {
    const total = await Item.countDocuments({ isDeleted: false });
    const products = await Item.countDocuments({ isDeleted: false, itemType: 'product' });
    const services = await Item.countDocuments({ isDeleted: false, itemType: 'service' });
    res.status(200).json({ success: true, stats: { total, products, services } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
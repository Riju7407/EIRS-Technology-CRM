const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const { search, itemType, page = 1, limit = 100 } = req.query;
    const query = { isDeleted: false };

    if (itemType) query.itemType = itemType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .sort({ itemType: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ success: true, count: categories.length, total, totalPages: Math.ceil(total / limit), currentPage: Number(page), categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const payload = {
      itemType: req.body.itemType,
      name: req.body.name,
      description: req.body.description,
    };

    const category = await Category.create(payload);
    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Category already exists for this item type' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Category already exists for this item type' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
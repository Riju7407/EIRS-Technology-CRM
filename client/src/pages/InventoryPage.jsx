import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiLayers, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { itemService } from '../services/itemService';
import { godownService } from '../services/godownService';
import { categoryService } from '../services/categoryService';

const itemSections = ['Basic Details', 'Stock Details', 'Pricing Details', 'Party Wise Prices', 'Custom Fields'];

const initialItemForm = {
  itemType: 'product',
  name: '',
  category: '',
  pricingBasis: '',
  pricingMode: 'without_tax',
  salesPrice: 0,
  purchasePrice: 0,
  gstTaxRate: 0,
  discountOnSalesPrice: 0,
  wholesaleRate: 0,
  measuringUnit: '',
  serviceCode: '',
  itemCode: '',
  hsnCode: '',
  openingStock: 0,
  asOfDate: '',
  description: '',
  godown: '',
  remarks: '',
  partyWisePrices: [{ partyName: '', price: 0 }],
  customFields: [{ label: '', value: '' }],
};

const initialGodownForm = {
  name: '',
  streetAddress: '',
  state: '',
  pincode: '',
  city: '',
};

const normalizeNumber = (value) => Number(value || 0);

const InventoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [itemGodownFilter, setItemGodownFilter] = useState('all');
  const [godownStateFilter, setGodownStateFilter] = useState('all');
  const [godownCityFilter, setGodownCityFilter] = useState('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showGodownModal, setShowGodownModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeItemSection, setActiveItemSection] = useState(itemSections[0]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingGodownId, setEditingGodownId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [godownForm, setGodownForm] = useState(initialGodownForm);
  const [categoryForm, setCategoryForm] = useState({ itemType: 'product', name: '', description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsResponse, godownsResponse, categoriesResponse] = await Promise.all([
        itemService.getAll({ page: 1, limit: 500 }),
        godownService.getAll({ page: 1, limit: 500 }),
        categoryService.getAll({ page: 1, limit: 500 }),
      ]);
      setItems(Array.isArray(itemsResponse.data.items) ? itemsResponse.data.items : []);
      setGodowns(Array.isArray(godownsResponse.data.godowns) ? godownsResponse.data.godowns : []);
      setCategories(Array.isArray(categoriesResponse.data.categories) ? categoriesResponse.data.categories : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load inventory data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const catalogCategories = useMemo(
    () => categories.filter((category) => category.itemType === itemForm.itemType),
    [categories, itemForm.itemType]
  );

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = !term || [item.name, item.category, item.itemCode, item.serviceCode, item.hsnCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

      const matchesType = itemTypeFilter === 'all' || item.itemType === itemTypeFilter;
      const matchesGodown = itemGodownFilter === 'all' || String(item.godown?._id || item.godown || '') === itemGodownFilter;

      return matchesSearch && matchesType && matchesGodown;
    });
  }, [itemGodownFilter, itemTypeFilter, items, searchTerm]);

  const filteredGodowns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return godowns.filter((godown) => {
      const matchesSearch = !term || [godown.name, godown.streetAddress, godown.city, godown.state, godown.pincode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

      const matchesState = godownStateFilter === 'all' || String(godown.state || '') === godownStateFilter;
      const matchesCity = godownCityFilter === 'all' || String(godown.city || '') === godownCityFilter;

      return matchesSearch && matchesState && matchesCity;
    });
  }, [godownCityFilter, godownStateFilter, godowns, searchTerm]);

  const refreshData = async () => {
    await loadData();
  };

  const openCreateItemForm = () => {
    setEditingItemId(null);
    setItemForm({
      ...initialItemForm,
      partyWisePrices: [{ partyName: '', price: 0 }],
      customFields: [{ label: '', value: '' }],
    });
    setActiveItemSection(itemSections[0]);
    setShowItemModal(true);
  };

  const openCreateCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ itemType: itemForm.itemType || 'product', name: '', description: '' });
    setShowCategoryModal(true);
  };

  const openEditCategoryForm = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({ itemType: category.itemType || 'product', name: category.name || '', description: category.description || '' });
    setShowCategoryModal(true);
  };

  const openEditItemForm = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      itemType: item.itemType || 'product',
      name: item.name || '',
      category: item.category || '',
      pricingBasis: item.pricingBasis || '',
      pricingMode: item.pricingMode || 'without_tax',
      salesPrice: item.salesPrice || 0,
      purchasePrice: item.purchasePrice || 0,
      gstTaxRate: item.gstTaxRate || 0,
      discountOnSalesPrice: item.discountOnSalesPrice || 0,
      wholesaleRate: item.wholesaleRate || 0,
      measuringUnit: item.measuringUnit || '',
      serviceCode: item.serviceCode || '',
      itemCode: item.itemCode || '',
      hsnCode: item.hsnCode || '',
      openingStock: item.openingStock || 0,
      asOfDate: item.asOfDate ? String(item.asOfDate).slice(0, 10) : '',
      description: item.description || '',
      godown: item.godown?._id || item.godown || '',
      remarks: item.remarks || '',
      partyWisePrices: item.partyWisePrices?.length ? item.partyWisePrices : [{ partyName: '', price: 0 }],
      customFields: item.customFields?.length ? item.customFields : [{ label: '', value: '' }],
    });
    setActiveItemSection(itemSections[0]);
    setShowItemModal(true);
  };

  const handleItemFormChange = (field, value) => setItemForm((prev) => ({ ...prev, [field]: value }));
  const handleCategoryFormChange = (field, value) => setCategoryForm((prev) => ({ ...prev, [field]: value }));

  const updatePartyWisePrice = (index, field, value) => {
    setItemForm((prev) => ({
      ...prev,
      partyWisePrices: prev.partyWisePrices.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addPartyWisePriceRow = () => setItemForm((prev) => ({ ...prev, partyWisePrices: [...prev.partyWisePrices, { partyName: '', price: 0 }] }));

  const removePartyWisePriceRow = (index) => {
    setItemForm((prev) => ({
      ...prev,
      partyWisePrices: prev.partyWisePrices.length > 1 ? prev.partyWisePrices.filter((_, rowIndex) => rowIndex !== index) : prev.partyWisePrices,
    }));
  };

  const updateCustomField = (index, field, value) => {
    setItemForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addCustomFieldRow = () => setItemForm((prev) => ({ ...prev, customFields: [...prev.customFields, { label: '', value: '' }] }));

  const removeCustomFieldRow = (index) => {
    setItemForm((prev) => ({
      ...prev,
      customFields: prev.customFields.length > 1 ? prev.customFields.filter((_, rowIndex) => rowIndex !== index) : prev.customFields,
    }));
  };

  const saveItem = async () => {
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    const payload = {
      ...itemForm,
      salesPrice: normalizeNumber(itemForm.salesPrice),
      purchasePrice: normalizeNumber(itemForm.purchasePrice),
      gstTaxRate: normalizeNumber(itemForm.gstTaxRate),
      discountOnSalesPrice: normalizeNumber(itemForm.discountOnSalesPrice),
      wholesaleRate: normalizeNumber(itemForm.wholesaleRate),
      openingStock: normalizeNumber(itemForm.openingStock),
      pricingBasis: itemForm.pricingBasis.trim(),
      pricingMode: itemForm.pricingMode,
      partyWisePrices: (itemForm.partyWisePrices || []).filter((row) => row.partyName || row.price),
      customFields: (itemForm.customFields || []).filter((row) => row.label || row.value),
      godown: itemForm.godown || undefined,
      asOfDate: itemForm.asOfDate || undefined,
    };

    try {
      if (editingItemId) {
        await itemService.update(editingItemId, payload);
        toast.success('Item updated successfully');
      } else {
        await itemService.create(payload);
        toast.success('Item created successfully');
      }
      setShowItemModal(false);
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemService.delete(itemId);
      toast.success('Item deleted successfully');
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const openCreateGodownForm = () => {
    setEditingGodownId(null);
    setGodownForm(initialGodownForm);
    setShowGodownModal(true);
  };

  const openEditGodownForm = (godown) => {
    setEditingGodownId(godown._id);
    setGodownForm({
      name: godown.name || '',
      streetAddress: godown.streetAddress || '',
      state: godown.state || '',
      pincode: godown.pincode || '',
      city: godown.city || '',
    });
    setShowGodownModal(true);
  };

  const handleGodownFormChange = (field, value) => setGodownForm((prev) => ({ ...prev, [field]: value }));

  const saveGodown = async () => {
    if (!godownForm.name.trim()) {
      toast.error('Godown name is required');
      return;
    }

    try {
      if (editingGodownId) {
        await godownService.update(editingGodownId, godownForm);
        toast.success('Godown updated successfully');
      } else {
        await godownService.create(godownForm);
        toast.success('Godown created successfully');
      }
      setShowGodownModal(false);
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save godown');
    }
  };

  const deleteGodown = async (godownId) => {
    if (!window.confirm('Delete this godown?')) return;
    try {
      await godownService.delete(godownId);
      toast.success('Godown deleted successfully');
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete godown');
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategoryId) {
        await categoryService.update(editingCategoryId, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await categoryService.create(categoryForm);
        toast.success('Category created successfully');
      }
      setShowCategoryModal(false);
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoryService.delete(categoryId);
      toast.success('Category deleted successfully');
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setItemTypeFilter('all');
    setItemGodownFilter('all');
    setGodownStateFilter('all');
    setGodownCityFilter('all');
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch = !term || [category.name, category.description, category.itemType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

      const matchesType = itemTypeFilter === 'all' || category.itemType === itemTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [categories, itemTypeFilter, searchTerm]);

  if (loading) {
    return <Spinner text="Loading inventory management..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Manage items, pricing details, and godowns from one dedicated admin page</p>
        </div>
        <div className="client-actions">
          <button className="btn btn-primary" onClick={openCreateItemForm}>
            <FiPlus /> Add Item
          </button>
          <button className="btn btn-secondary" onClick={openCreateGodownForm}>
            <FiLayers /> Add Godown
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('items')}
        >
          Items ({filteredItems.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'godowns' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('godowns')}
        >
          Godowns ({filteredGodowns.length})
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body quotation-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder={activeTab === 'items' ? 'Search items by name, category, code, or HSN...' : 'Search godowns by name, city, state, or address...'}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          {activeTab === 'items' ? (
            <>
              <div className="form-group">
                <label className="form-label">Item Type</label>
                <select className="form-control" value={itemTypeFilter} onChange={(event) => setItemTypeFilter(event.target.value)}>
                  <option value="all">All Types</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Godown</label>
                <select className="form-control" value={itemGodownFilter} onChange={(event) => setItemGodownFilter(event.target.value)}>
                  <option value="all">All Godowns</option>
                  {godowns.map((godown) => (
                    <option key={godown._id} value={godown._id}>{godown.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-control" value={godownStateFilter} onChange={(event) => setGodownStateFilter(event.target.value)}>
                  <option value="all">All States</option>
                  {[...new Set(godowns.map((godown) => godown.state).filter(Boolean))].map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-control" value={godownCityFilter} onChange={(event) => setGodownCityFilter(event.target.value)}>
                  <option value="all">All Cities</option>
                  {[...new Set(godowns.map((godown) => godown.city).filter(Boolean))].map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'items' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>Items</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-primary">{filteredItems.length} / {items.length}</span>
              <span className="badge badge-info">{filteredCategories.length} Categories</span>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Sales Price</th>
                  <th>Stock</th>
                  <th>Godown</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>
                      {items.length === 0 ? 'No items created yet.' : 'No items match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{item.itemType}</td>
                      <td>{item.category || 'N/A'}</td>
                      <td>Rs {Number(item.salesPrice || 0).toLocaleString('en-IN')}</td>
                      <td>{Number(item.openingStock || 0).toLocaleString('en-IN')}</td>
                      <td>{item.godown?.name || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditItemForm(item)}>
                            <FiEdit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteItem(item._id)}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'godowns' && (
        <div className="card">
          <div className="card-header">
            <h3>Godowns</h3>
            <span className="badge badge-info">{filteredGodowns.length} / {godowns.length}</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Street Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Pincode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGodowns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>
                      {godowns.length === 0 ? 'No godowns created yet.' : 'No godowns match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredGodowns.map((godown) => (
                    <tr key={godown._id}>
                      <td><strong>{godown.name}</strong></td>
                      <td>{godown.streetAddress || 'N/A'}</td>
                      <td>{godown.city || 'N/A'}</td>
                      <td>{godown.state || 'N/A'}</td>
                      <td>{godown.pincode || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditGodownForm(godown)}>
                            <FiEdit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteGodown(godown._id)}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItemId ? 'Edit Item' : 'Create New Item'}
        size="xl"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveItem}>
              <FiSave /> Save Item
            </button>
          </div>
        )}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {itemSections.map((section) => (
            <button
              key={section}
              type="button"
              className={`btn btn-sm ${activeItemSection === section ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveItemSection(section)}
            >
              {section}
            </button>
          ))}
        </div>

        {activeItemSection === 'Basic Details' && (
          <div className="quotation-grid">
            <div className="form-group">
              <label className="form-label">Item Type</label>
              <select
                className="form-control"
                value={itemForm.itemType}
                onChange={(event) => {
                  handleItemFormChange('itemType', event.target.value);
                  handleItemFormChange('category', '');
                }}
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-control" value={itemForm.name} onChange={(event) => handleItemFormChange('name', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={itemForm.category} onChange={(event) => handleItemFormChange('category', event.target.value)}>
                <option value="">Select category</option>
                {catalogCategories.map((category) => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-secondary btn-sm" type="button" onClick={openCreateCategoryForm}>
                  <FiPlus /> Add Category
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pricing Basis</label>
              <input
                className="form-control"
                placeholder="Example: Retail, MRP, Wholesale"
                value={itemForm.pricingBasis}
                onChange={(event) => handleItemFormChange('pricingBasis', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Mode</label>
              <select className="form-control" value={itemForm.pricingMode} onChange={(event) => handleItemFormChange('pricingMode', event.target.value)}>
                <option value="without_tax">Without Tax</option>
                <option value="with_tax">With Tax</option>
              </select>
            </div>
          </div>
        )}

        {activeItemSection === 'Stock Details' && (
          <div className="quotation-grid">
            <div className="form-group">
              <label className="form-label">Item Code</label>
              <input className="form-control" value={itemForm.itemCode} onChange={(event) => handleItemFormChange('itemCode', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">HSN Code</label>
              <input className="form-control" value={itemForm.hsnCode} onChange={(event) => handleItemFormChange('hsnCode', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Measuring Unit</label>
              <input className="form-control" value={itemForm.measuringUnit} onChange={(event) => handleItemFormChange('measuringUnit', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Godown</label>
              <select className="form-control" value={itemForm.godown} onChange={(event) => handleItemFormChange('godown', event.target.value)}>
                <option value="">Select godown</option>
                {godowns.map((godown) => <option key={godown._id} value={godown._id}>{godown.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Opening Stock</label>
              <input type="number" min="0" className="form-control" value={itemForm.openingStock} onChange={(event) => handleItemFormChange('openingStock', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">As Of Date</label>
              <input type="date" className="form-control" value={itemForm.asOfDate} onChange={(event) => handleItemFormChange('asOfDate', event.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={itemForm.description} onChange={(event) => handleItemFormChange('description', event.target.value)} />
            </div>
            {itemForm.itemType === 'service' && (
              <div className="form-group">
                <label className="form-label">Service Code</label>
                <input className="form-control" value={itemForm.serviceCode} onChange={(event) => handleItemFormChange('serviceCode', event.target.value)} />
              </div>
            )}
          </div>
        )}

        {activeItemSection === 'Pricing Details' && (
          <div className="quotation-grid">
            <div className="form-group">
              <label className="form-label">Sales Price</label>
              <input type="number" min="0" className="form-control" value={itemForm.salesPrice} onChange={(event) => handleItemFormChange('salesPrice', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Price</label>
              <input type="number" min="0" className="form-control" value={itemForm.purchasePrice} onChange={(event) => handleItemFormChange('purchasePrice', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Tax Rate (%)</label>
              <input type="number" min="0" className="form-control" value={itemForm.gstTaxRate} onChange={(event) => handleItemFormChange('gstTaxRate', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Discount on Sales Price</label>
              <input type="number" min="0" className="form-control" value={itemForm.discountOnSalesPrice} onChange={(event) => handleItemFormChange('discountOnSalesPrice', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Wholesale Rate</label>
              <input type="number" min="0" className="form-control" value={itemForm.wholesaleRate} onChange={(event) => handleItemFormChange('wholesaleRate', Number(event.target.value || 0))} />
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea className="form-control" rows={4} value={itemForm.remarks} onChange={(event) => handleItemFormChange('remarks', event.target.value)} />
            </div>
          </div>
        )}

        {activeItemSection === 'Party Wise Prices' && (
          <div>
            {itemForm.partyWisePrices.map((row, index) => (
              <div key={`party-price-${index}`} className="quotation-grid" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Party Name</label>
                  <input className="form-control" value={row.partyName} onChange={(event) => updatePartyWisePrice(index, 'partyName', event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input type="number" min="0" className="form-control" value={row.price} onChange={(event) => updatePartyWisePrice(index, 'price', Number(event.target.value || 0))} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removePartyWisePriceRow(index)} disabled={itemForm.partyWisePrices.length === 1}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" type="button" onClick={addPartyWisePriceRow}>
              <FiPlus /> Add Party Price
            </button>
          </div>
        )}

        {activeItemSection === 'Custom Fields' && (
          <div>
            {itemForm.customFields.map((row, index) => (
              <div key={`custom-field-${index}`} className="quotation-grid" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Field Label</label>
                  <input className="form-control" value={row.label} onChange={(event) => updateCustomField(index, 'label', event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Field Value</label>
                  <input className="form-control" value={row.value} onChange={(event) => updateCustomField(index, 'value', event.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removeCustomFieldRow(index)} disabled={itemForm.customFields.length === 1}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" type="button" onClick={addCustomFieldRow}>
              <FiPlus /> Add Custom Field
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showGodownModal}
        onClose={() => setShowGodownModal(false)}
        title={editingGodownId ? 'Edit Godown' : 'Add Godown'}
        size="lg"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setShowGodownModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveGodown}>
              <FiSave /> Save Godown
            </button>
          </div>
        )}
      >
        <div className="quotation-grid">
          <div className="form-group">
            <label className="form-label">Godown Name</label>
            <input className="form-control" value={godownForm.name} onChange={(event) => handleGodownFormChange('name', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input className="form-control" value={godownForm.streetAddress} onChange={(event) => handleGodownFormChange('streetAddress', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-control" value={godownForm.state} onChange={(event) => handleGodownFormChange('state', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-control" value={godownForm.pincode} onChange={(event) => handleGodownFormChange('pincode', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" value={godownForm.city} onChange={(event) => handleGodownFormChange('city', event.target.value)} />
          </div>
        </div>
      </Modal>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Categories</h3>
          <button className="btn btn-secondary btn-sm" onClick={openCreateCategoryForm}>
            <FiPlus /> Add Category
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>
                    {categories.length === 0 ? 'No categories created yet.' : 'No categories match the current filters.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category._id}>
                    <td><strong>{category.name}</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{category.itemType}</td>
                    <td>{category.description || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditCategoryForm(category)}>
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteCategory(category._id)}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategoryId ? 'Edit Category' : 'Add Category'}
        size="lg"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveCategory}>
              <FiSave /> Save Category
            </button>
          </div>
        )}
      >
        <div className="quotation-grid">
          <div className="form-group">
            <label className="form-label">Category Type</label>
            <select className="form-control" value={categoryForm.itemType} onChange={(event) => handleCategoryFormChange('itemType', event.target.value)}>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input className="form-control" value={categoryForm.name} onChange={(event) => handleCategoryFormChange('name', event.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={4} value={categoryForm.description} onChange={(event) => handleCategoryFormChange('description', event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
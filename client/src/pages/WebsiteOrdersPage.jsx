import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiShoppingBag, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { websiteSyncService } from '../services/websiteSyncService';

const initialForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  totalPrice: 0,
  totalItems: 0,
  status: 'Pending',
  paymentStatus: 'Pending',
  paymentMethod: '',
  notes: '',
};

const WebsiteOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        websiteSyncService.getOrders({ page: 1, limit: 500, search, status }),
        websiteSyncService.getStats(),
      ]);
      setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);
      setStats(statsRes.data?.stats || null);
    } catch (_) {
      toast.error('Failed to load website orders');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, status]);

  const revenue = useMemo(
    () => orders.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    [orders]
  );

  const openCreate = () => {
    setEditData(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEdit = (order) => {
    setEditData(order);
    setFormData({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      totalPrice: Number(order.totalPrice || 0),
      totalItems: Number(order.totalItems || 0),
      status: order.status || 'Pending',
      paymentStatus: order.paymentStatus || 'Pending',
      paymentMethod: order.paymentMethod || '',
      notes: order.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        totalPrice: Number(formData.totalPrice || 0),
        totalItems: Number(formData.totalItems || 0),
      };

      if (editData?._id) {
        await websiteSyncService.updateOrder(editData._id, payload);
        toast.success('Website order updated');
      } else {
        await websiteSyncService.createOrder(payload);
        toast.success('Website order created');
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save website order');
    }
  };

  const handleDelete = async (id, orderId) => {
    if (!window.confirm(`Delete order "${orderId || 'record'}"?`)) return;
    try {
      await websiteSyncService.deleteOrder(id);
      toast.success('Website order deleted');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete website order');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Orders</h1>
          <p>Orders synced from EIRS website checkout</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add Order
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiShoppingBag color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.orders ?? orders.length}</h4>
            <p>Total Website Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiShoppingBag color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>Rs {Math.round(revenue).toLocaleString()}</h4>
            <p>Visible Order Value</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by order id, customer, phone, email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select className="form-control" style={{ maxWidth: 180 }} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website orders..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.externalOrderId}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.paymentMethod || 'N/A'}</div>
                    </td>
                    <td>
                      <div>{order.customerName || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.customerEmail || order.customerPhone || 'N/A'}</div>
                    </td>
                    <td>{Array.isArray(order.items) ? order.items.length : 0}</td>
                    <td style={{ fontWeight: 600 }}>Rs {Number(order.totalPrice || 0).toLocaleString()}</td>
                    <td><StatusBadge value={String(order.status || '').toLowerCase()} /></td>
                    <td><StatusBadge value={String(order.paymentStatus || '').toLowerCase()} /></td>
                    <td>{order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(order)} title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(order._id, order.externalOrderId)} title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <h3>No website orders found</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editData ? 'Edit Website Order' : 'Add Website Order'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="website-order-form" className="btn btn-primary">
              {editData ? 'Update Order' : 'Create Order'}
            </button>
          </>
        }
      >
        <form id="website-order-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                className="form-control"
                required
                value={formData.customerName}
                onChange={(event) => setFormData((prev) => ({ ...prev, customerName: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Phone</label>
              <input
                className="form-control"
                value={formData.customerPhone}
                onChange={(event) => setFormData((prev) => ({ ...prev, customerPhone: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.customerEmail}
                onChange={(event) => setFormData((prev) => ({ ...prev, customerEmail: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <input
                className="form-control"
                value={formData.paymentMethod}
                onChange={(event) => setFormData((prev) => ({ ...prev, paymentMethod: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Price</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.totalPrice}
                onChange={(event) => setFormData((prev) => ({ ...prev, totalPrice: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Items</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.totalItems}
                onChange={(event) => setFormData((prev) => ({ ...prev, totalItems: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                className="form-control"
                value={formData.paymentStatus}
                onChange={(event) => setFormData((prev) => ({ ...prev, paymentStatus: event.target.value }))}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WebsiteOrdersPage;

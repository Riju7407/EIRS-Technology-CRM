import React, { useEffect, useState } from 'react';
import { FiCalendar, FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { websiteSyncService } from '../services/websiteSyncService';

const initialForm = {
  serviceName: '',
  servicePrice: 0,
  customerName: '',
  email: '',
  phoneNumber: '',
  address: '',
  preferredDate: '',
  notes: '',
};

const WebsiteBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        websiteSyncService.getBookings({ page: 1, limit: 500, search }),
        websiteSyncService.getStats(),
      ]);
      setBookings(Array.isArray(bookingsRes.data?.bookings) ? bookingsRes.data.bookings : []);
      setStats(statsRes.data?.stats || null);
    } catch (_) {
      toast.error('Failed to load service bookings');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const openCreate = () => {
    setEditData(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEdit = (booking) => {
    setEditData(booking);
    setFormData({
      serviceName: booking.serviceName || '',
      servicePrice: Number(booking.servicePrice || 0),
      customerName: booking.customerName || '',
      email: booking.email || '',
      phoneNumber: booking.phoneNumber || '',
      address: booking.address || '',
      preferredDate: booking.preferredDate ? new Date(booking.preferredDate).toISOString().slice(0, 10) : '',
      notes: booking.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        servicePrice: Number(formData.servicePrice || 0),
        preferredDate: formData.preferredDate || null,
      };

      if (editData?._id) {
        await websiteSyncService.updateBooking(editData._id, payload);
        toast.success('Website booking updated');
      } else {
        await websiteSyncService.createBooking(payload);
        toast.success('Website booking created');
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save website booking');
    }
  };

  const handleDelete = async (id, serviceName) => {
    if (!window.confirm(`Delete booking for "${serviceName || 'service'}"?`)) return;
    try {
      await websiteSyncService.deleteBooking(id);
      toast.success('Website booking deleted');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete website booking');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Service Bookings</h1>
          <p>Service booking requests synced from website</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add Booking
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiCalendar color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.bookings ?? bookings.length}</h4>
            <p>Total Website Bookings</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by service, customer, phone, email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website bookings..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Preferred Date</th>
                  <th>Address</th>
                  <th>Booked At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length ? bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.serviceName || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rs {Number(booking.servicePrice || 0).toLocaleString()}</div>
                    </td>
                    <td>{booking.customerName || 'N/A'}</td>
                    <td>{booking.phoneNumber || 'N/A'}</td>
                    <td>{booking.email || 'N/A'}</td>
                    <td>{booking.preferredDate ? format(new Date(booking.preferredDate), 'dd MMM yyyy') : 'N/A'}</td>
                    <td>{booking.address || 'N/A'}</td>
                    <td>{booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(booking)} title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(booking._id, booking.serviceName)} title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <h3>No website bookings found</h3>
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
        title={editData ? 'Edit Website Booking' : 'Add Website Booking'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="website-booking-form" className="btn btn-primary">
              {editData ? 'Update Booking' : 'Create Booking'}
            </button>
          </>
        }
      >
        <form id="website-booking-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input
                className="form-control"
                required
                value={formData.serviceName}
                onChange={(event) => setFormData((prev) => ({ ...prev, serviceName: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Service Price</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.servicePrice}
                onChange={(event) => setFormData((prev) => ({ ...prev, servicePrice: event.target.value }))}
              />
            </div>
          </div>
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
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={formData.phoneNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.preferredDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, preferredDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.address}
              onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
            />
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

export default WebsiteBookingsPage;

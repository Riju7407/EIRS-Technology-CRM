import React, { useEffect, useState } from 'react';
import { FiEdit2, FiMail, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { websiteSyncService } from '../services/websiteSyncService';

const initialForm = {
  name: '',
  email: '',
  phoneNumber: '',
  subject: '',
  message: '',
};

const WebsiteContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsRes, statsRes] = await Promise.all([
        websiteSyncService.getContacts({ page: 1, limit: 500, search }),
        websiteSyncService.getStats(),
      ]);
      setContacts(Array.isArray(contactsRes.data?.contacts) ? contactsRes.data.contacts : []);
      setStats(statsRes.data?.stats || null);
    } catch (_) {
      toast.error('Failed to load website contacts');
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

  const openEdit = (contact) => {
    setEditData(contact);
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phoneNumber: contact.phoneNumber || '',
      subject: contact.subject || '',
      message: contact.message || '',
    });
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      if (editData?._id) {
        await websiteSyncService.updateContact(editData._id, formData);
        toast.success('Website contact updated');
      } else {
        await websiteSyncService.createContact(formData);
        toast.success('Website contact created');
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save website contact');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete contact "${name}"?`)) return;
    try {
      await websiteSyncService.deleteContact(id);
      toast.success('Website contact deleted');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete website contact');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Contact Enquiries</h1>
          <p>Contact form submissions synced from website</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add Contact
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiMail color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.contacts ?? contacts.length}</h4>
            <p>Total Contact Requests</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search by name, email, phone, subject"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Spinner text="Loading website contacts..." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length ? contacts.map((contact) => (
                  <tr key={contact._id}>
                    <td style={{ fontWeight: 600 }}>{contact.name || 'N/A'}</td>
                    <td>
                      <div>{contact.email || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.phoneNumber || 'N/A'}</div>
                    </td>
                    <td>{contact.subject || 'N/A'}</td>
                    <td style={{ minWidth: 280 }}>{contact.message || 'N/A'}</td>
                    <td>{contact.createdAt ? format(new Date(contact.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(contact)} title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(contact._id, contact.name)} title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <h3>No website contact requests found</h3>
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
        title={editData ? 'Edit Website Contact' : 'Add Website Contact'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="website-contact-form" className="btn btn-primary">
              {editData ? 'Update Contact' : 'Create Contact'}
            </button>
          </>
        }
      >
        <form id="website-contact-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                required
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={formData.phoneNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                className="form-control"
                value={formData.subject}
                onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-control"
              rows={4}
              value={formData.message}
              onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WebsiteContactsPage;

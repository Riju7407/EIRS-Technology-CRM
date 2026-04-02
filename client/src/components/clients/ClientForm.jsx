import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { clientService } from '../../services/clientService';
import API from '../../api/axios';

const defaultForm = {
  firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
  company: '', status: 'lead', source: 'other',
  address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
  tags: '', notes: '',
};

const ClientForm = ({ isOpen, onClose, editData, onSaved }) => {
  const [form, setForm] = useState(defaultForm);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      // Load employees from the Employee model
      API.get('/employees', { params: { status: 'active', limit: 500 } })
        .then(({ data }) => setAgents(data.employees || []))
        .catch(() => toast.error('Failed to load employees'));
    }
    if (editData) {
      setForm({
        ...editData,
        tags: editData.tags?.join(', ') || '',
        assignedTo: editData.assignedTo?._id || '',
        address: editData.address || defaultForm.address,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await clientService.update(editData._id, payload);
        toast.success('Client updated successfully');
      } else {
        await clientService.create(payload);
        toast.success('Client created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Client' : 'Add New Client'}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="John" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Doe" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 9876543210" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Company</label>
            <input className="form-control" name="company" value={form.company} onChange={handleChange} placeholder="Company Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Alternate Phone</label>
            <input className="form-control" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="+91..." />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleChange}>
              {['lead', 'prospect', 'active', 'inactive', 'churned'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Source</label>
            <select className="form-control" name="source" value={form.source} onChange={handleChange}>
              {['referral', 'website', 'social_media', 'cold_call', 'market', 'other'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" name="address.city" value={form.address.city} onChange={handleChange} placeholder="Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-control" name="address.state" value={form.address.state} onChange={handleChange} placeholder="Maharashtra" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Assign To (Employee)</label>
          <select className="form-control" name="assignedTo" value={form.assignedTo || ''} onChange={handleChange}>
            <option value="">-- Select Employee --</option>
            {agents.length > 0 ? (
              agents.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.role || 'Employee'}){a.region ? ` - ${a.region}` : ''}
                </option>
              ))
            ) : (
              <option disabled>No employees available</option>
            )}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input className="form-control" name="tags" value={form.tags} onChange={handleChange} placeholder="vip, wholesale, retail" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Additional notes about this client..." />
        </div>
      </form>
    </Modal>
  );
};

export default ClientForm;

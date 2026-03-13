import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { followUpService } from '../../services/followUpService';
import { clientService } from '../../services/clientService';
import API from '../../api/axios';

const LABELS = [
  'Pending Response', 'Payment Due', 'Scheduled Call',
  'Market Follow-up', 'Urgent', 'New Lead', 'Proposal Sent',
  'Negotiation', 'Contract Review', 'Onboarding', 'General',
];

const getLabelClass = (label) => {
  const map = {
    'Pending Response': 'label-pending',
    'Payment Due': 'label-payment',
    'Scheduled Call': 'label-call',
    'Market Follow-up': 'label-market',
    'Urgent': 'label-urgent',
  };
  return map[label] || 'label-general';
};

const defaultForm = {
  client: '', title: '', description: '', label: 'General',
  priority: 'medium', scheduledDate: '', scheduledTime: '',
  channel: 'phone', assignedTo: '',
};

const FollowUpForm = ({ isOpen, onClose, editData, preselectedClient, onSaved }) => {
  const [form, setForm] = useState(defaultForm);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      clientService.getAll({ limit: 100 }).then(({ data }) => setClients(data.clients || [])).catch(() => {});
      API.get('/auth/users').then(({ data }) => setAgents(data.users || [])).catch(() => {});
    }
    if (editData) {
      const d = new Date(editData.scheduledDate);
      setForm({
        ...editData,
        client: editData.client?._id || editData.client || '',
        assignedTo: editData.assignedTo?._id || editData.assignedTo || '',
        scheduledDate: d.toISOString().split('T')[0],
        scheduledTime: editData.scheduledTime || '',
      });
    } else {
      setForm({ ...defaultForm, client: preselectedClient || '' });
    }
  }, [editData, isOpen, preselectedClient]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client || !form.title || !form.scheduledDate) {
      return toast.error('Client, title, and date are required');
    }
    setLoading(true);
    try {
      if (isEdit) {
        await followUpService.update(editData._id, form);
        toast.success('Follow-up updated');
      } else {
        await followUpService.create(form);
        toast.success('Follow-up scheduled');
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
      title={isEdit ? 'Edit Follow-Up' : 'Schedule Follow-Up'}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Schedule'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Client *</label>
          <select className="form-control" name="client" value={form.client} onChange={handleChange} required disabled={!!preselectedClient}>
            <option value="">-- Select Client --</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.email}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-control" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Renewal discussion call" />
        </div>
        <div className="form-group">
          <label className="form-label">Label</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LABELS.map((lbl) => (
              <button
                type="button"
                key={lbl}
                className={`label-tag ${getLabelClass(lbl)}`}
                style={{
                  cursor: 'pointer',
                  border: form.label === lbl ? '2px solid currentColor' : '2px solid transparent',
                  fontWeight: form.label === lbl ? 700 : 500,
                }}
                onClick={() => setForm((prev) => ({ ...prev, label: lbl }))}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Scheduled Date *</label>
            <input className="form-control" type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-control" type="time" name="scheduledTime" value={form.scheduledTime} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-control" name="priority" value={form.priority} onChange={handleChange}>
              {['low', 'medium', 'high', 'critical'].map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Channel</label>
            <select className="form-control" name="channel" value={form.channel} onChange={handleChange}>
              {['phone', 'email', 'in-person', 'video_call', 'whatsapp', 'other'].map((ch) => (
                <option key={ch} value={ch}>{ch.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-control" name="assignedTo" value={form.assignedTo} onChange={handleChange}>
            <option value="">-- Self --</option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>{a.name} ({a.role})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Additional context for this follow-up..." />
        </div>
        {isEdit && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleChange}>
              {['scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'].map((s) => (
                <option key={s} value={s}>{s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        )}
        {(form.status === 'completed' || form.status === 'cancelled') && (
          <div className="form-group">
            <label className="form-label">Outcome / Notes</label>
            <textarea className="form-control" name="outcome" value={form.outcome || ''} onChange={handleChange} rows={2} placeholder="What was the outcome of this follow-up?" />
          </div>
        )}
      </form>
    </Modal>
  );
};

export default FollowUpForm;

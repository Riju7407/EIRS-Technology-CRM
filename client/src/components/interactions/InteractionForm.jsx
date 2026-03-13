import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { interactionService } from '../../services/interactionService';
import { clientService } from '../../services/clientService';

const defaultForm = {
  client: '', type: 'call', subject: '', description: '',
  channel: 'phone', priority: 'medium', status: 'open',
  sentiment: 'neutral', tags: '', resolution: '',
};

const InteractionForm = ({ isOpen, onClose, editData, preselectedClient, onSaved }) => {
  const [form, setForm] = useState(defaultForm);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      clientService.getAll({ limit: 100 }).then(({ data }) => setClients(data.clients || [])).catch(() => {});
    }
    if (editData) {
      setForm({
        ...editData,
        client: editData.client?._id || editData.client || '',
        tags: editData.tags?.join(', ') || '',
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
    if (!form.client || !form.subject || !form.description) {
      return toast.error('Client, subject, and description are required');
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await interactionService.update(editData._id, payload);
        toast.success('Interaction updated');
      } else {
        await interactionService.create(payload);
        toast.success('Interaction logged');
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
      title={isEdit ? 'Edit Interaction' : 'Log New Interaction'}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Log Interaction'}
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
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select className="form-control" name="type" value={form.type} onChange={handleChange}>
              {['query', 'complaint', 'feedback', 'call', 'email', 'meeting', 'note', 'other'].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Channel</label>
            <select className="form-control" name="channel" value={form.channel} onChange={handleChange}>
              {['phone', 'email', 'in-person', 'video_call', 'whatsapp', 'portal', 'other'].map((ch) => (
                <option key={ch} value={ch}>{ch.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input className="form-control" name="subject" value={form.subject} onChange={handleChange} required placeholder="Brief subject of the interaction" />
        </div>
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea className="form-control" name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Detailed description of the interaction, query, or complaint..." />
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
            <label className="form-label">Sentiment</label>
            <select className="form-control" name="sentiment" value={form.sentiment} onChange={handleChange}>
              {['positive', 'neutral', 'negative'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        {isEdit && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                {['open', 'in-progress', 'resolved', 'closed', 'escalated'].map((s) => (
                  <option key={s} value={s}>{s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-control" name="tags" value={form.tags} onChange={handleChange} placeholder="tag1, tag2" />
            </div>
          </div>
        )}
        {(form.status === 'resolved' || form.status === 'closed') && (
          <div className="form-group">
            <label className="form-label">Resolution</label>
            <textarea className="form-control" name="resolution" value={form.resolution} onChange={handleChange} rows={2} placeholder="How was this resolved?" />
          </div>
        )}
      </form>
    </Modal>
  );
};

export default InteractionForm;

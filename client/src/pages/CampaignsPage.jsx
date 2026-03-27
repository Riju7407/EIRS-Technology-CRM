import React, { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiMail, FiPlus, FiSearch, FiTarget, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { campaignService } from '../services/campaignService';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  campaignId: '',
  name: '',
  channel: 'other',
  reach: '',
  budget: '',
  roi: '',
  status: 'planned',
  startDate: '',
  endDate: '',
  notes: '',
};

const channelOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'field-outreach', label: 'Field Outreach' },
  { value: 'social-media', label: 'Social Media' },
  { value: 'sms', label: 'SMS' },
  { value: 'other', label: 'Other' },
];

const channelLabelMap = channelOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const CampaignsPage = () => {
  const { isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 10 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        campaignService.getAll(filters),
        campaignService.getStats(),
      ]);
      const campaignList = Array.isArray(listRes?.data?.campaigns) ? listRes.data.campaigns : [];
      setCampaigns(campaignList);
      setTotal(Number(listRes?.data?.total) || 0);
      setTotalPages(Number(listRes?.data?.totalPages) || 1);
      setStats(statsRes?.data?.stats || null);
    } catch (_) {
      setCampaigns([]);
      setTotal(0);
      setTotalPages(1);
      setStats(null);
      toast.error('Failed to load campaigns');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditData(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditData(item);
    setFormData({
      campaignId: item.campaignId || '',
      name: item.name || '',
      channel: item.channel || 'other',
      reach: item.reach || '',
      budget: item.budget || '',
      roi: item.roi || '',
      status: item.status || 'planned',
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        reach: Number(formData.reach || 0),
        budget: Number(formData.budget || 0),
        roi: Number(formData.roi || 0),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      if (editData?._id) {
        await campaignService.update(editData._id, payload);
        toast.success('Campaign updated successfully');
      } else {
        await campaignService.create(payload);
        toast.success('Campaign created successfully');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign');
    }
  };

  const handleDelete = async (id, campaignId) => {
    if (!window.confirm(`Delete campaign "${campaignId}"?`)) return;
    try {
      await campaignService.delete(id);
      toast.success('Campaign deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const campaignList = Array.isArray(campaigns) ? campaigns : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Campaigns</h1>
          <p>Plan, launch, and measure your customer outreach programs</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Create Campaign
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FiTarget color="var(--primary)" />
          </div>
          <div className="stat-info">
            <h4>{stats?.active ?? 0}</h4>
            <p>Active Campaigns</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <FiTrendingUp color="var(--success)" />
          </div>
          <div className="stat-info">
            <h4>{Number(stats?.avgRoi || 0).toFixed(2)}x</h4>
            <p>Average ROI</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-light)' }}>
            <FiMail color="var(--info)" />
          </div>
          <div className="stat-info">
            <h4>{Number(stats?.totalReach || 0).toLocaleString()}</h4>
            <p>Total Reach</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="form-control filter-select"
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">All Statuses</option>
          {['planned', 'active', 'paused', 'completed'].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Campaign ID</th>
                    <th>Name</th>
                    <th>Channel</th>
                    <th>Reach</th>
                    <th>ROI</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignList.length ? campaignList.map((campaign) => (
                    <tr key={campaign._id}>
                      <td style={{ fontWeight: 600 }}>{campaign.campaignId}</td>
                      <td>{campaign.name}</td>
                      <td>{channelLabelMap[campaign.channel] || campaign.channel}</td>
                      <td>{Number(campaign.reach || 0).toLocaleString()}</td>
                      <td>{Number(campaign.roi || 0).toFixed(2)}x</td>
                      <td><span className={`badge ${campaign.status === 'active' ? 'badge-success' : campaign.status === 'completed' ? 'badge-info' : campaign.status === 'paused' ? 'badge-warning' : 'badge-secondary'}`}>{campaign.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(campaign)} title="Edit">
                            <FiEdit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(campaign._id, campaign.campaignId)} title="Delete">
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}><div className="empty-state"><h3>No campaigns found</h3></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Showing {campaignList.length} of {total} campaigns</span>
              <div className="pagination-controls">
                <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <span style={{ padding: '5px 10px', fontSize: 13 }}>Page {filters.page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={filters.page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editData ? 'Edit Campaign' : 'Create Campaign'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" form="campaign-form" className="btn btn-primary">{editData ? 'Update' : 'Create'}</button>
          </>
        }
      >
        <form id="campaign-form" onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Campaign ID</label>
              <input className="form-control" required value={formData.campaignId} onChange={(e) => setFormData((p) => ({ ...p, campaignId: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-control" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select className="form-control" value={formData.channel} onChange={(e) => setFormData((p) => ({ ...p, channel: e.target.value }))}>
                {channelOptions.map((channel) => (
                  <option key={channel.value} value={channel.value}>{channel.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}>
                {['planned', 'active', 'paused', 'completed'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reach</label>
              <input type="number" className="form-control" min="0" value={formData.reach} onChange={(e) => setFormData((p) => ({ ...p, reach: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input type="number" className="form-control" min="0" value={formData.budget} onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ROI</label>
              <input type="number" step="0.01" className="form-control" value={formData.roi} onChange={(e) => setFormData((p) => ({ ...p, roi: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-control" value={formData.endDate} onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CampaignsPage;

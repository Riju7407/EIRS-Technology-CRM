import API from '../api/axios';

export const campaignService = {
  getAll: (params) => API.get('/campaigns', { params }),
  create: (data) => API.post('/campaigns', data),
  update: (id, data) => API.put(`/campaigns/${id}`, data),
  delete: (id) => API.delete(`/campaigns/${id}`),
  getStats: () => API.get('/campaigns/stats'),
};

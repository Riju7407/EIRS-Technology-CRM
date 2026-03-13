import API from '../api/axios';

export const followUpService = {
  getAll: (params) => API.get('/followups', { params }),
  getById: (id) => API.get(`/followups/${id}`),
  create: (data) => API.post('/followups', data),
  update: (id, data) => API.put(`/followups/${id}`, data),
  delete: (id) => API.delete(`/followups/${id}`),
  getStats: () => API.get('/followups/stats'),
  getLabels: () => API.get('/followups/labels'),
};

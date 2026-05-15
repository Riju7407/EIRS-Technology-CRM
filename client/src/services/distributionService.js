import API from '../api/axios';

export const distributionService = {
  getAll: (params) => API.get('/distribution', { params }),
  getMy: (params) => API.get('/distribution/my', { params }),
  create: (data) => API.post('/distribution', data),
  update: (id, data) => API.put(`/distribution/${id}`, data),
  updateMy: (id, data) => API.put(`/distribution/my/${id}`, data),
  delete: (id) => API.delete(`/distribution/${id}`),
  getStats: () => API.get('/distribution/stats'),
};

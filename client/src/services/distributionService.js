import API from '../api/axios';

export const distributionService = {
  getAll: (params) => API.get('/distribution', { params }),
  create: (data) => API.post('/distribution', data),
  update: (id, data) => API.put(`/distribution/${id}`, data),
  delete: (id) => API.delete(`/distribution/${id}`),
  getStats: () => API.get('/distribution/stats'),
};

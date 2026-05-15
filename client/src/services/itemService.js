import API from '../api/axios';

export const itemService = {
  getAll: (params) => API.get('/items', { params }),
  getStats: () => API.get('/items/stats'),
  create: (data) => API.post('/items', data),
  update: (id, data) => API.put(`/items/${id}`, data),
  delete: (id) => API.delete(`/items/${id}`),
};
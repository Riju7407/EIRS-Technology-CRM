import API from '../api/axios';

export const godownService = {
  getAll: (params) => API.get('/godowns', { params }),
  create: (data) => API.post('/godowns', data),
  update: (id, data) => API.put(`/godowns/${id}`, data),
  delete: (id) => API.delete(`/godowns/${id}`),
};
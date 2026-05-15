import API from '../api/axios';

export const categoryService = {
  getAll: (params) => API.get('/categories', { params }),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`),
};

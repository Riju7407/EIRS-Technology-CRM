import API from '../api/axios';

export const employeeService = {
  getAll: (params) => API.get('/employees', { params }),
  create: (data) => API.post('/employees', data),
  update: (id, data) => API.put(`/employees/${id}`, data),
  delete: (id) => API.delete(`/employees/${id}`),
  getStats: () => API.get('/employees/stats'),
};

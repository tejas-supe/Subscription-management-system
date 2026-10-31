import api from './api';

export const customerService = {
  list: (params?: { search?: string; status?: string }) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getTimeline: (id: string) => api.get(`/customers/${id}/timeline`),
};

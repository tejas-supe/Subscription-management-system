import api from './api';

export const invoiceService = {
  list: (params?: { status?: string; customerId?: string; search?: string }) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  void: (id: string) => api.post(`/invoices/${id}/void`),
};

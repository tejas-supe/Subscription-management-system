import api from './api';

export const paymentService = {
  list: (params?: { status?: string; customerId?: string; method?: string }) => api.get('/payments', { params }),
  record: (data: any) => api.post('/payments', data),
  create: (data: any) => api.post('/payments', data),
  simulateGateway: (data: { invoiceId: string; method?: string; simulateSuccess?: boolean; notes?: string }) => api.post('/payments/simulate-gateway', data),
  refund: (id: string, reason: string) => api.post(`/payments/${id}/refund`, { reason }),
};

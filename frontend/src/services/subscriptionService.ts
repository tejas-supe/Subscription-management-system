import api from './api';

export const subscriptionService = {
  list: (params?: { status?: string; customerId?: string; planId?: string; billingInterval?: string }) => api.get('/subscriptions', { params }),
  get: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: any) => api.post('/subscriptions', data),
  pause: (id: string) => api.post(`/subscriptions/${id}/pause`),
  resume: (id: string) => api.post(`/subscriptions/${id}/resume`),
  changePlan: (id: string, newPlanId: string) => api.post(`/subscriptions/${id}/change-plan`, { newPlanId }),
  cancel: (id: string, reason: string) => api.post(`/subscriptions/${id}/cancel`, { reason }),
  renew: (id: string) => api.post(`/subscriptions/${id}/renew`),
  runBillingCycle: () => api.post('/subscriptions/run-billing-cycle'),
};

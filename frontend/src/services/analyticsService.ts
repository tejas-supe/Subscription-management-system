import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const analyticsService = {
  getKpis: (range?: string) => api.get('/analytics/kpis', { params: { range } }),
  getMrrTrend: () => api.get('/analytics/mrr-trend'),
  getPlanDistribution: () => api.get('/analytics/plan-distribution'),
  exportCsvUrl: () => `${API_BASE}/analytics/export-csv?token=${localStorage.getItem('brightloop_token') || ''}`,
  getRevenueSentinel: () => api.get('/intelligence/revenue-alerts'),
  getHealthMonitor: () => api.get('/intelligence/health-monitor'),
  getRenewals: () => api.get('/intelligence/renewals'),
  getReconciliation: () => api.get('/intelligence/reconciliation'),
};

export const quotationService = {
  list: (params?: { status?: string; customerId?: string }) => api.get('/quotations', { params }),
  get: (id: string) => api.get(`/quotations/${id}`),
  create: (data: any) => api.post('/quotations', data),
  send: (id: string) => api.post(`/quotations/${id}/send`),
  accept: (id: string) => api.post(`/quotations/${id}/accept`),
  reject: (id: string) => api.post(`/quotations/${id}/reject`),
  convert: (id: string) => api.post(`/quotations/${id}/convert`),
};

export const portalService = {
  getDashboard: () => api.get('/portal/dashboard'),
  requestPlanChange: (targetPlanId: string, notes?: string) => api.post('/portal/request-plan-change', { targetPlanId, notes }),
  requestCancellation: (reason?: string) => api.post('/portal/request-cancellation', { reason }),
  updateProfile: (data: any) => api.put('/portal/profile', data),
};

export const discountService = {
  list: () => api.get('/discounts'),
  create: (data: any) => api.post('/discounts', data),
  update: (id: string, data: any) => api.put(`/discounts/${id}`, data),
  validate: (data: { code: string; amountInPaise: number }) => api.post('/discounts/validate', data),
};

export const teamService = {
  list: () => api.get('/team'),
  create: (data: any) => api.post('/team', data),
  updateRole: (id: string, data: any) => api.put(`/team/${id}`, data),
};

export const auditService = {
  list: (params?: { entity?: string; action?: string; limit?: number }) => api.get('/audit-logs', { params }),
};

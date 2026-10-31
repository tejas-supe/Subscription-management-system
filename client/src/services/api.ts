import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brightloop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login page, redirect or clear
      if (!window.location.pathname.includes('/login')) {
        // localStorage.removeItem('brightloop_token');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  switchPersona: (targetRole: 'ADMIN' | 'STAFF' | 'CUSTOMER') => api.post('/auth/switch-persona', { targetRole }),
  me: () => api.get('/auth/me'),
};

export const customerApi = {
  list: (params?: { search?: string; status?: string }) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getTimeline: (id: string) => api.get(`/customers/${id}/timeline`),
};

export const productApi = {
  list: (params?: { status?: string; category?: string }) => api.get('/products', { params }),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const planApi = {
  list: (params?: { productId?: string; status?: string; billingInterval?: string }) => api.get('/plans', { params }),
  getComparison: (productId?: string) => api.get('/plans/comparison-matrix', { params: { productId } }),
  create: (data: any) => api.post('/plans', data),
  update: (id: string, data: any) => api.put(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

export const quotationApi = {
  list: (params?: { status?: string; customerId?: string }) => api.get('/quotations', { params }),
  get: (id: string) => api.get(`/quotations/${id}`),
  create: (data: any) => api.post('/quotations', data),
  send: (id: string) => api.post(`/quotations/${id}/send`),
  accept: (id: string) => api.post(`/quotations/${id}/accept`),
  reject: (id: string) => api.post(`/quotations/${id}/reject`),
  convert: (id: string) => api.post(`/quotations/${id}/convert`),
};

export const subscriptionApi = {
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

export const invoiceApi = {
  list: (params?: { status?: string; customerId?: string; search?: string }) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  void: (id: string) => api.post(`/invoices/${id}/void`),
};

export const paymentApi = {
  list: (params?: { status?: string; customerId?: string; method?: string }) => api.get('/payments', { params }),
  record: (data: any) => api.post('/payments', data),
  simulateGateway: (data: { invoiceId: string; method?: string; simulateSuccess?: boolean; notes?: string }) => api.post('/payments/simulate-gateway', data),
  refund: (id: string, reason: string) => api.post(`/payments/${id}/refund`, { reason }),
};

export const discountApi = {
  list: () => api.get('/discounts'),
  create: (data: any) => api.post('/discounts', data),
  update: (id: string, data: any) => api.put(`/discounts/${id}`, data),
  validate: (data: { code: string; amountInPaise: number; customerId?: string }) => api.post('/discounts/validate', data),
};

export const taxApi = {
  list: () => api.get('/taxes'),
  create: (data: any) => api.post('/taxes', data),
  update: (id: string, data: any) => api.put(`/taxes/${id}`, data),
};

export const analyticsApi = {
  getKpis: (range?: string) => api.get('/analytics/kpis', { params: { range } }),
  getMrrTrend: () => api.get('/analytics/mrr-trend'),
  getPlanDistribution: () => api.get('/analytics/plan-distribution'),
  exportCsvUrl: () => `${API_BASE}/analytics/export-csv?token=${localStorage.getItem('brightloop_token') || ''}`,
};

export const intelligenceApi = {
  getHealthMonitor: () => api.get('/intelligence/health-monitor'),
  getRenewals: () => api.get('/intelligence/renewals'),
  getRevenueAlerts: () => api.get('/intelligence/revenue-alerts'),
  getReconciliation: () => api.get('/intelligence/reconciliation'),
};

export const portalApi = {
  getDashboard: () => api.get('/portal/dashboard'),
  requestPlanChange: (targetPlanId: string, notes?: string) => api.post('/portal/request-plan-change', { targetPlanId, notes }),
  requestCancellation: (reason?: string) => api.post('/portal/request-cancellation', { reason }),
  updateProfile: (data: any) => api.put('/portal/profile', data),
};

export const teamApi = {
  list: () => api.get('/team'),
  create: (data: any) => api.post('/team', data),
  updateRole: (id: string, data: any) => api.put(`/team/${id}`, data),
};

export const auditApi = {
  list: (params?: { entity?: string; action?: string; limit?: number }) => api.get('/audit-logs', { params }),
};

export default api;

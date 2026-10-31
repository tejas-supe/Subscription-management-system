import api from './api';

export const productService = {
  list: (params?: { status?: string; category?: string }) => api.get('/products', { params }),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  listPlans: (params?: { productId?: string; status?: string; billingInterval?: string }) => api.get('/plans', { params }),
  createPlan: (data: any) => api.post('/plans', data),
  updatePlan: (id: string, data: any) => api.put(`/plans/${id}`, data),
  deletePlan: (id: string) => api.delete(`/plans/${id}`),
  comparePlans: (productId?: string) => api.get('/plans/comparison-matrix', { params: { productId } }),
};

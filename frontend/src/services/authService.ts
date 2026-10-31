import api from './api';
import { UserRole } from '../types';

export const authService = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: UserRole }) => api.post('/team', data),
  switchPersona: (targetRole: UserRole) => api.post('/auth/switch-persona', { targetRole }),
  me: () => api.get('/auth/me'),
};

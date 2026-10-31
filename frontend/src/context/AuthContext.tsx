import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchPersona: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('brightloop_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('brightloop_token');
      if (storedToken) {
        try {
          const res = await authService.me();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Token validation failed, falling back to default admin demo login');
        }
      }

      // Auto-login as default ADMIN for hackathon presentation convenience
      try {
        const res = await authService.login({
          email: 'admin@brightloop.io',
          password: 'Brightloop@2025'
        });
        if (res.data.success) {
          localStorage.setItem('brightloop_token', res.data.token);
          setToken(res.data.token);
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Demo auto-login failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authService.login({ email, password });
      if (res.data.success) {
        localStorage.setItem('brightloop_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'STAFF'): Promise<boolean> => {
    try {
      const res = await authService.register({ name, email, password, role });
      if (res.data.success) {
        return await login(email, password);
      }
      return false;
    } catch (err) {
      console.error('Register error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('brightloop_token');
    setToken(null);
    setUser(null);
  };

  const switchPersona = async (role: UserRole) => {
    setLoading(true);
    try {
      const res = await authService.switchPersona(role);
      if (res.data.success) {
        localStorage.setItem('brightloop_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Switch persona failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchPersona,
        isAdmin,
        isStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

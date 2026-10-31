import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Brightloop@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        if (email.includes('vertex') || email.includes('customer')) {
          navigate('/customer/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError('Invalid enterprise email credentials or suspended role.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication service unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Brightloop@2025');
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-chartreuse selection:text-obsidian">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Monogram */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-obsidian text-chartreuse font-bold text-xl shadow-card mb-3">
          BL
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-obsidian">
          BRIGHTLOOP
        </h2>
        <p className="mt-1 text-xs text-slategrey uppercase tracking-widest font-semibold">
          Enterprise Subscription Cloud
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-elevated rounded-2xl border border-bordergrey sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-obsidian mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slategrey pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.io"
                  className="w-full rounded-xl border border-bordergrey bg-ivory/30 pl-9 pr-3 py-2 text-xs text-obsidian outline-none focus:border-forest shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-obsidian">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-forest hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slategrey pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-bordergrey bg-ivory/30 pl-9 pr-10 py-2 text-xs text-obsidian outline-none focus:border-forest shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slategrey hover:text-obsidian"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-obsidian py-2.5 px-4 text-xs font-bold text-white shadow-subtle hover:bg-forest disabled:opacity-50 transition-colors"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="h-4 w-4 text-chartreuse" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Judges */}
          <div className="mt-6 pt-5 border-t border-bordergrey">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slategrey text-center mb-2.5">
              Hackathon Judge Demo Credentials (Click to prefill)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@brightloop.io', 'Admin')}
                className="py-1.5 px-2 rounded-lg border border-bordergrey bg-ivory/60 hover:bg-chartreuse-glow/30 hover:border-chartreuse text-[11px] font-semibold text-obsidian text-center transition-all"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff@brightloop.io', 'Staff')}
                className="py-1.5 px-2 rounded-lg border border-bordergrey bg-ivory/60 hover:bg-chartreuse-glow/30 hover:border-chartreuse text-[11px] font-semibold text-obsidian text-center transition-all"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('arun.nair@vertexmedia.in', 'Customer')}
                className="py-1.5 px-2 rounded-lg border border-bordergrey bg-ivory/60 hover:bg-chartreuse-glow/30 hover:border-chartreuse text-[11px] font-semibold text-obsidian text-center transition-all"
              >
                Customer
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slategrey">
              Need a team account?{' '}
              <Link to="/register" className="font-semibold text-forest hover:underline">
                Register staff member
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

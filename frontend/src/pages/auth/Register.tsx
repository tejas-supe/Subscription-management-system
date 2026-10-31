import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await register(name, email, password, role);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Failed to create account. Email may already exist.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-chartreuse selection:text-obsidian">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-obsidian text-chartreuse font-bold text-xl shadow-card mb-3">
          BL
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-obsidian">
          Create Staff Account
        </h2>
        <p className="mt-1 text-xs text-slategrey uppercase tracking-widest font-semibold">
          Join Brightloop Revenue Operations
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
                Full Legal Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slategrey pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full rounded-xl border border-bordergrey bg-ivory/30 pl-9 pr-3 py-2 text-xs text-obsidian outline-none focus:border-forest shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-obsidian mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slategrey pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@brightloop.io"
                  className="w-full rounded-xl border border-bordergrey bg-ivory/30 pl-9 pr-3 py-2 text-xs text-obsidian outline-none focus:border-forest shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-obsidian mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                    role === 'STAFF'
                      ? 'border-forest bg-forest text-white'
                      : 'border-bordergrey bg-ivory/50 text-slategrey hover:text-obsidian'
                  }`}
                >
                  Staff Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                    role === 'ADMIN'
                      ? 'border-forest bg-forest text-white'
                      : 'border-bordergrey bg-ivory/50 text-slategrey hover:text-obsidian'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-obsidian mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slategrey pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-bordergrey bg-ivory/30 pl-9 pr-3 py-2 text-xs text-obsidian outline-none focus:border-forest shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-obsidian py-2.5 px-4 text-xs font-bold text-white shadow-subtle hover:bg-forest disabled:opacity-50 transition-colors"
            >
              <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
              <ArrowRight className="h-4 w-4 text-chartreuse" />
            </button>
          </form>

          <div className="mt-5 text-center pt-4 border-t border-bordergrey">
            <p className="text-xs text-slategrey">
              Already have an enterprise account?{' '}
              <Link to="/login" className="font-semibold text-forest hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

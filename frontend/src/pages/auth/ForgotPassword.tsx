import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-chartreuse selection:text-obsidian">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-obsidian text-chartreuse font-bold text-xl shadow-card mb-3">
          BL
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-obsidian">
          Password Recovery
        </h2>
        <p className="mt-1 text-xs text-slategrey uppercase tracking-widest font-semibold">
          Reset corporate security credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-elevated rounded-2xl border border-bordergrey sm:px-10">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-obsidian">Recovery Email Dispatched</h3>
              <p className="text-xs text-slategrey">
                We've simulated sending a credential reset link to <strong>{email}</strong>. Check your corporate inbox.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to sign in</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slategrey">
                Enter your registered corporate email to receive security verification steps.
              </p>
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
                    placeholder="admin@brightloop.io"
                    className="w-full rounded-xl border border-bordergrey bg-ivory/30 pl-9 pr-3 py-2 text-xs text-obsidian outline-none focus:border-forest shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-obsidian py-2.5 px-4 text-xs font-bold text-white shadow-subtle hover:bg-forest transition-colors"
              >
                Send Password Reset Instructions
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import { User } from '../types/client.types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register(name, email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.guest();
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest session initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/12 bg-[#0E1218]/85 backdrop-blur-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-base font-semibold text-white">
              {isRegister ? 'Create Scholar Account' : 'Sign In to Research Engine'}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Save your investigative sessions and sync sources across devices.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="my-4 space-y-3">
          {isRegister && (
            <div>
              <label className="text-[11px] font-medium text-neutral-300 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Evelyn Vance"
                  className="w-full bg-[#141822] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-neutral-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institute.org"
                className="w-full bg-[#141822] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141822] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-neutral-950 bg-amber-300 hover:bg-amber-200 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="hover:text-amber-300 transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>

          <button
            onClick={handleGuest}
            disabled={loading}
            className="text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>Guest Scholar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

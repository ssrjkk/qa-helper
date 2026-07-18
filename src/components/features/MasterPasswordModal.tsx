import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { keyManager } from '../../lib/keyManagement';

interface MasterPasswordModalProps {
  onSuccess: () => void;
}

export function MasterPasswordModal({ onSuccess }: MasterPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    keyManager.hasStoredSalt().then(has => setIsNewUser(!has));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isNewUser && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await keyManager.initialize(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  if (isNewUser === null) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4 p-6 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-white">
            {isNewUser ? 'Create Master Password' : 'Enter Master Password'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {isNewUser
              ? 'Protect your API keys with a master password. This password encrypts all stored credentials — it cannot be recovered if lost.'
              : 'Enter your master password to decrypt stored API keys.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="master-password" className="block text-sm font-medium text-gray-300 mb-1">
              Master Password
            </label>
            <input
              id="master-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoFocus
              aria-label="Master password"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50 transition-all"
            />
          </div>

          {isNewUser && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                aria-label="Confirm password"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50 transition-all"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 8}
            className="w-full px-4 py-2.5 bg-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-500/50 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            {loading ? 'Initializing...' : isNewUser ? 'Create Password' : 'Unlock'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

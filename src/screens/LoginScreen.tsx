import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loginWithKey } from '../services/auth';
import logo from '../assets/logo.png';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isArabic = i18n.language === 'ar';

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  const handleLogin = async () => {
    if (!accessKey.trim()) return;
    setError('');
    setLoading(true);

    try {
      await loginWithKey(accessKey);
      // Auth state change will be handled by App.tsx
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-6"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 text-sm text-slate-400 hover:text-white transition-colors"
      >
        {isArabic ? 'EN' : 'عربي'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        {/* Logo */}
        <motion.img
          src={logo}
          alt="KegelTN"
          className="w-24 h-24 mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* App name */}
        <h1 className="text-3xl font-bold text-white mb-2">KegelTN</h1>

        {/* Tagline */}
        <p className="text-slate-400 text-sm mb-10">{t('login.tagline')}</p>

        {/* Access key input */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={accessKey}
            onChange={(e) => {
              setAccessKey(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder={t('login.placeholder')}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-center text-base outline-none focus:border-[#4F8EF7] focus:ring-1 focus:ring-[#4F8EF7] transition-all"
            dir="ltr"
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Login button */}
        <motion.button
          onClick={handleLogin}
          disabled={loading || !accessKey.trim()}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-xl bg-[#4F8EF7] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            t('login.button')
          )}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-slate-600 text-xs">
        KegelTN © 2026
      </p>
    </div>
  );
}
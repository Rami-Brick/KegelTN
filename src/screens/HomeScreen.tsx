import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Circle, HelpCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logout } from '../services/auth';

interface HomeScreenProps {
  userId: string;
  onStartWorkout: () => void;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting_morning';
  if (hour < 18) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [
    ...new Set(dates.map((d) => new Date(d).toDateString())),
  ]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWorkout = new Date(uniqueDays[0]);
  lastWorkout.setHours(0, 0, 0, 0);

  if (lastWorkout < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = new Date(uniqueDays[i - 1]);
    curr.setHours(0, 0, 0, 0);
    const prev = new Date(uniqueDays[i]);
    prev.setHours(0, 0, 0, 0);

    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default function HomeScreen({ userId, onStartWorkout }: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [streak, setStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('workouts')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (data && data.length > 0) {
        const dates = data.map((w) => w.completed_at);
        setStreak(calculateStreak(dates));

        const today = new Date().toDateString();
        setDoneToday(dates.some((d) => new Date(d).toDateString() === today));
      }

      setLoading(false);
    }

    fetchStats();
  }, [userId]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col items-center px-6 relative"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <LogOut className="w-5 h-5" />
      </button>

      {/* Language toggle */}
      <button
        onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
        className="absolute top-6 left-6 text-sm text-slate-500 hover:text-white transition-colors"
      >
        {isArabic ? 'EN' : 'عربي'}
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-slate-400 text-lg mb-2"
        >
          {t(getGreetingKey())}
        </motion.p>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2 mb-8"
        >
          <Flame
            className={`w-5 h-5 ${streak > 0 ? 'text-orange-400' : 'text-slate-600'}`}
          />
          <span
            className={`text-sm font-medium ${streak > 0 ? 'text-orange-400' : 'text-slate-600'}`}
          >
            {loading
              ? '...'
              : streak > 0
                ? t('home.streak', { count: streak })
                : t('home.streak_zero')}
          </span>
        </motion.div>

        {/* Big CTA button */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-8"
        >
          <motion.button
            onClick={onStartWorkout}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="w-44 h-44 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#3B6FD4] text-white font-bold text-xl shadow-[0_0_40px_rgba(79,142,247,0.3)] flex items-center justify-center"
          >
            {t('home.start')}
          </motion.button>
        </motion.div>

        {/* Today's status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2 mb-12"
        >
          {loading ? (
            <span className="text-slate-600 text-sm">...</span>
          ) : doneToday ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
              <span className="text-[#34D399] text-sm font-medium">
                {t('home.today_done')}
              </span>
            </>
          ) : (
            <>
              <Circle className="w-5 h-5 text-slate-600" />
              <span className="text-slate-500 text-sm">
                {t('home.today_pending')}
              </span>
            </>
          )}
        </motion.div>

        {/* How-to link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm underline">{t('home.howto')}</span>
        </motion.button>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, LogOut, User, Target, TrendingUp,
  Flame, Dumbbell, Clock, CheckCircle2, Circle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logout } from '../services/auth';
import { fetchActiveExercises, fetchCompletions, computeExerciseStatuses, exerciseToKey, CATEGORIES, resetProgression, deleteQuizResults } from '../services/exercises';
import type { UserProfile, Exercise } from '../services/exercises';

interface JourneyScreenProps {
  userId: string;
  userProfile: UserProfile;
  onBack: () => void;
  onRetakeQuiz: () => void;
}

interface Stats {
  totalWorkouts: number;
  streak: number;
  totalMinutes: number;
  workoutDates: string[];
}

interface CategoryProgress {
  category: string;
  exercises: { name: string; completed: boolean; difficulty: string }[];
}

const CATEGORY_ORDER = ['rigidity', 'stamina', 'endurance'];

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map((d) => new Date(d).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const last = new Date(unique[0]); last.setHours(0, 0, 0, 0);
  if (last < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const c = new Date(unique[i - 1]); c.setHours(0, 0, 0, 0);
    const p = new Date(unique[i]); p.setHours(0, 0, 0, 0);
    if ((c.getTime() - p.getTime()) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}

function MonthCalendar({ activeDates }: { activeDates: Set<string> }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const dayLabels = isArabic
    ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((l) => (
          <span key={l} className="text-center text-[10px] text-slate-600 font-medium">{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = new Date(year, month, day).toDateString();
          const isActive = activeDates.has(dateStr);
          const isToday = day === today;

          return (
            <div
              key={i}
              className={`w-full aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-[#4F8EF7] text-white'
                  : isToday
                    ? 'bg-white/10 text-white'
                    : 'text-slate-600'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JourneyScreen({ userId, userProfile, onBack, onRetakeQuiz }: JourneyScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [stats, setStats] = useState<Stats>({ totalWorkouts: 0, streak: 0, totalMinutes: 0, workoutDates: [] });
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch workout stats
      const { data: workouts } = await supabase
        .from('workouts')
        .select('completed_at, duration_seconds')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      const dates = (workouts ?? []).map((w) => w.completed_at);
      const totalMin = Math.round((workouts ?? []).reduce((sum, w) => sum + (w.duration_seconds || 0), 0) / 60);

      setStats({
        totalWorkouts: (workouts ?? []).length,
        streak: calculateStreak(dates),
        totalMinutes: totalMin,
        workoutDates: dates,
      });

      // Fetch exercise progression
      const [exercises, completions] = await Promise.all([
        fetchActiveExercises(),
        fetchCompletions(userId),
      ]);

      const progress = CATEGORY_ORDER.map((cat) => {
        const catExercises = exercises
          .filter((e: Exercise) => e.category === cat)
          .sort((a: Exercise, b: Exercise) => {
            const order = ['beginner', 'intermediate', 'advanced'];
            return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
          });

        return {
          category: cat,
          exercises: catExercises.map((e: Exercise) => ({
            name: e.name,
            completed: completions.has(e.id),
            difficulty: e.difficulty,
          })),
        };
      });

      setCategoryProgress(progress);
      setLoading(false);
    }
    load();
  }, [userId]);

  const activeDateSet = new Set(stats.workoutDates.map((d) => new Date(d).toDateString()));

  const focusKey =
    userProfile.goalCategories.length === 3
      ? 'focus_all'
      : userProfile.goalCategories.includes('rigidity')
        ? 'focus_rigidity'
        : userProfile.goalCategories.includes('stamina')
          ? 'focus_stamina'
          : 'focus_endurance';

  const motivationKey = `motivation_${userProfile.difficulty}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Header — back always left, logout always right */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">{t('journey.title')}</h1>
        </div>
        <button
          onClick={() => logout()}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="max-w-sm mx-auto space-y-5">

          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center">
                <User className="w-6 h-6 text-[#4F8EF7]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t('journey.not_set')}</p>
                <p className="text-slate-500 text-xs">{t('journey.profile')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('journey.name'), value: '—' },
                { label: t('journey.age'), value: '—' },
                { label: t('journey.weight'), value: '—' },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                  <p className="text-slate-600 text-[10px] mb-1">{item.label}</p>
                  <p className="text-slate-400 text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Focus & motivation */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#4F8EF7]" />
              <span className="text-white font-semibold text-sm">{t('journey.focus_title')}</span>
            </div>
            <p className="text-[#4F8EF7] text-sm font-medium mb-2">{t(`journey.${focusKey}`)}</p>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400 text-xs">
                {t('journey.level')}: {t(`difficulty.${userProfile.difficulty}`)}
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed italic">
              {t(`journey.${motivationKey}`)}
            </p>
            {/* Quiz & progression actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
              <button
                onClick={onRetakeQuiz}
                className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                {t('journey.retake_quiz')}
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                {t('journey.reset_progress')}
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
          >
            <span className="text-white font-semibold text-sm mb-4 block">{t('journey.stats_title')}</span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Dumbbell, value: stats.totalWorkouts, label: t('journey.total_workouts'), color: '#4F8EF7' },
                { icon: Flame, value: stats.streak, label: t('journey.current_streak'), color: '#F97316' },
                { icon: Clock, value: stats.totalMinutes, label: t('journey.total_time'), color: '#34D399' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 flex flex-col items-center gap-2">
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  <span className="text-white font-bold text-lg">{s.value}</span>
                  <span className="text-slate-500 text-[10px] text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly activity */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
          >
            <span className="text-white font-semibold text-sm mb-4 block">{t('journey.activity_title')}</span>
            <MonthCalendar activeDates={activeDateSet} />
          </motion.div>

          {/* Exercise progression */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
          >
            <span className="text-white font-semibold text-sm mb-4 block">{t('journey.progression_title')}</span>
            <div className="space-y-4">
              {categoryProgress.map((cat) => {
                const catStyle = CATEGORIES[cat.category];
                const completedCount = cat.exercises.filter((e) => e.completed).length;

                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: catStyle.color }}>
                        {t(`library.category_${cat.category}`)}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {t('journey.progression_completed', { count: completedCount })}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: catStyle.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedCount / 3) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      />
                    </div>
                    {/* Exercise list */}
                    <div className="space-y-2">
                      {cat.exercises.map((ex) => {
                        const key = exerciseToKey(ex.name);
                        return (
                          <div key={ex.name} className="flex items-center gap-2.5">
                            {ex.completed ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: catStyle.color }} />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-700 shrink-0" />
                            )}
                            <span className={`text-xs ${ex.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                              {t(`exercises.${key}.name`, { defaultValue: ex.name })}
                            </span>
                            <span className="text-slate-700 text-[10px] ms-auto">
                              {t(`difficulty.${ex.difficulty}`)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Reset confirmation modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center px-6 z-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#141A2E] border border-white/10 rounded-2xl p-6"
            >
              <p className="text-white text-lg font-semibold text-center mb-6">
                {t('journey.reset_confirm')}
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium text-sm"
                >
                  {t('journey.reset_no')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await resetProgression(userId);
                    setShowResetModal(false);
                    // Reload the page data
                    setLoading(true);
                    const [exList, completions] = await Promise.all([
                      fetchActiveExercises(),
                      fetchCompletions(userId),
                    ]);
                    const withStatus = computeExerciseStatuses(exList, completions);
                    setCategoryProgress(CATEGORY_ORDER.map((cat) => ({
                      category: cat,
                      exercises: withStatus
                        .filter((e) => e.category === cat)
                        .map((e) => ({ name: e.name, completed: e.isCompleted, difficulty: e.difficulty })),
                    })));
                    setLoading(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium text-sm"
                >
                  {t('journey.reset_yes')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
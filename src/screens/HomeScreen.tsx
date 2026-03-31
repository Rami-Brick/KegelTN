import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Flame,
  Globe,
  HelpCircle,
  LogOut,
  Medal,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logout } from '../services/auth';
import {
  CATEGORIES,
  computeExerciseStatuses,
  exerciseToKey,
  fetchActiveExercises,
  fetchCompletions,
} from '../services/exercises';
import type { ExerciseWithStatus, UserProfile } from '../services/exercises';

interface HomeScreenProps {
  userId: string;
  userProfile: UserProfile;
  onStartWorkout: () => void;
  onOpenJourney: () => void;
}

type WeekdayKey = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

interface WorkoutRecord {
  completed_at: string;
  duration_seconds: number | null;
}

interface WeeklyDay {
  key: WeekdayKey;
  completed: boolean;
  isToday: boolean;
  totalSeconds: number;
}

interface HomeStats {
  currentStreak: number;
  totalSessions: number;
  doneToday: boolean;
  weeklyActivityDays: number;
  weeklyDays: WeeklyDay[];
  percentile: string | null;
}

interface CategoryProgress {
  category: string;
  exercises: Pick<ExerciseWithStatus, 'id' | 'name' | 'difficulty' | 'isCompleted' | 'isCurrentLevel'>[];
}

const WEEK_ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const CATEGORY_ORDER = ['rigidity', 'stamina', 'endurance'];
const MILESTONE_KEYS: Record<number, string> = {
  7: 'home.streak.milestone7',
  14: 'home.streak.milestone14',
  30: 'home.streak.milestone30',
  60: 'home.streak.milestone60',
  90: 'home.streak.milestone90',
};

function getOrderedCategories(goalCategories: string[]): string[] {
  const goalSet = new Set(goalCategories);
  return [
    ...CATEGORY_ORDER.filter((category) => goalSet.has(category)),
    ...CATEGORY_ORDER.filter((category) => !goalSet.has(category)),
  ];
}

function getDefaultExpandedCategories(goalCategories: string[]): string[] {
  const orderedGoals = CATEGORY_ORDER.filter((category) => goalCategories.includes(category));
  if (orderedGoals.length === 0) return [CATEGORY_ORDER[0]];
  if (orderedGoals.length === CATEGORY_ORDER.length) return [orderedGoals[0]];
  return orderedGoals;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting_morning';
  if (hour < 18) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates.map((d) => startOfDay(new Date(d)).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWorkout = startOfDay(uniqueDays[0]);
  if (lastWorkout < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = startOfDay(uniqueDays[i - 1]);
    const prev = startOfDay(uniqueDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getWeekStart(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const offset = (day + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

function getPercentile(totalSessions: number): string | null {
  if (totalSessions === 0) return null;
  if (totalSessions <= 2) return '40%';
  if (totalSessions <= 5) return '30%';
  if (totalSessions <= 9) return '10%';
  if (totalSessions <= 14) return '5%';
  if (totalSessions <= 24) return '2%';
  return '1%';
}

function deriveHomeStats(workouts: WorkoutRecord[]): HomeStats {
  const dates = workouts.map((workout) => workout.completed_at);
  const completedDays = new Set(dates.map((d) => startOfDay(new Date(d)).toDateString()));
  const today = startOfDay(new Date());
  const todayKey = today.toDateString();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weeklyTotals = new Map<string, number>();

  workouts.forEach((workout) => {
    const workoutDate = startOfDay(new Date(workout.completed_at));
    if (workoutDate < weekStart || workoutDate >= weekEnd) return;

    const dateKey = workoutDate.toDateString();
    weeklyTotals.set(dateKey, (weeklyTotals.get(dateKey) ?? 0) + (workout.duration_seconds ?? 0));
  });

  const weeklyDays = WEEK_ORDER.map((key, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateKey = startOfDay(date).toDateString();

    return {
      key,
      completed: completedDays.has(dateKey),
      isToday: dateKey === todayKey,
      totalSeconds: weeklyTotals.get(dateKey) ?? 0,
    };
  });

  const currentStreak = calculateStreak(dates);
  const totalSessions = dates.length;
  const doneToday = completedDays.has(todayKey);
  const weeklyActivityDays = weeklyDays.filter((day) => day.completed).length;

  return {
    currentStreak,
    totalSessions,
    doneToday,
    weeklyActivityDays,
    weeklyDays,
    percentile: getPercentile(totalSessions),
  };
}

function getMilestoneKey(streak: number): string | null {
  return MILESTONE_KEYS[streak] ?? null;
}

export default function HomeScreen({ userId, userProfile, onStartWorkout, onOpenJourney }: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() =>
    getDefaultExpandedCategories(userProfile.goalCategories)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setExpandedCategories(getDefaultExpandedCategories(userProfile.goalCategories));
  }, [userProfile.goalCategories]);

  useEffect(() => {
    async function fetchStats() {
      const [{ data: workoutRows }, exercises, completions] = await Promise.all([
        supabase
          .from('workouts')
          .select('completed_at, duration_seconds')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
        fetchActiveExercises(),
        fetchCompletions(userId),
      ]);

      const statuses = computeExerciseStatuses(exercises, completions);
      const orderedCategories = getOrderedCategories(userProfile.goalCategories);

      setWorkouts((workoutRows ?? []) as WorkoutRecord[]);
      setCategoryProgress(
        orderedCategories.map((category) => ({
          category,
          exercises: statuses
            .filter((exercise) => exercise.category === category)
            .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
            .map((exercise) => ({
              id: exercise.id,
              name: exercise.name,
              difficulty: exercise.difficulty,
              isCompleted: exercise.isCompleted,
              isCurrentLevel: exercise.isCurrentLevel,
            })),
        }))
      );
      setLoading(false);
    }

    fetchStats();
  }, [userId, userProfile.goalCategories]);

  const stats = deriveHomeStats(workouts);
  const milestoneKey = getMilestoneKey(stats.currentStreak);
  const maxWeeklySeconds = Math.max(...stats.weeklyDays.map((day) => day.totalSeconds), 1);
  const streakLabel = loading
    ? '...'
    : stats.currentStreak === 0
      ? t('home.streak.startStreak')
      : milestoneKey
        ? t(milestoneKey)
        : t('home.streak.days', { count: stats.currentStreak });
  const percentileLabel = loading
    ? '...'
    : stats.percentile
      ? t('home.percentile.label', { percent: stats.percentile })
      : t('home.percentile.zero');
  const flameSize =
    stats.currentStreak >= 8 ? 34 : stats.currentStreak >= 4 ? 30 : stats.currentStreak >= 1 ? 26 : 22;
  const flameGlowClass =
    stats.currentStreak >= 8
      ? 'shadow-[0_0_32px_rgba(251,146,60,0.35)]'
      : stats.currentStreak >= 4
        ? 'shadow-[0_0_18px_rgba(251,146,60,0.24)]'
        : '';
  const flameAnimation =
    stats.currentStreak >= 8
      ? { scale: [1, 1.08, 1] }
      : stats.currentStreak >= 4
        ? { scale: [1, 1.04, 1] }
        : undefined;
  const flameTransition =
    stats.currentStreak >= 4
      ? { duration: stats.currentStreak >= 8 ? 2 : 2.6, repeat: Infinity, ease: 'easeInOut' as const }
      : undefined;
  const toggleCategory = (category: string) => {
    setExpandedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

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
        className="absolute top-6 left-6 text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-2"
      >
        <Globe className="w-4 h-4" />
        <span>{isArabic ? 'EN' : 'عربي'}</span>
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-sm py-16">
        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-slate-400 text-lg mb-3"
        >
          {t(getGreetingKey())}
        </motion.p>

        {/* Percentile badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="w-full rounded-2xl border border-[#4F8EF7]/25 bg-gradient-to-br from-[#4F8EF7]/16 to-[#4F8EF7]/6 px-3.5 py-3 mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#4F8EF7]/15 flex items-center justify-center shrink-0">
              <Medal className="w-4.5 h-4.5 text-[#7CC8FF]" />
            </div>
            <div className="flex-1 text-start">
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.16em] mb-0.5">
                {t('home.percentile.badge')}
              </p>
              <p className="text-slate-300 text-[13px] leading-snug">
                {percentileLabel}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Streak module */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="w-full rounded-3xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3.5 mb-6"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={flameAnimation}
              transition={flameTransition}
              className={`w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 ${flameGlowClass}`}
            >
              <Flame
                className={stats.currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}
                style={{ width: flameSize, height: flameSize }}
              />
            </motion.div>

            <div className="flex-1 text-start min-w-0">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-white text-2xl font-bold leading-none">
                  {loading ? '...' : stats.currentStreak}
                </span>
                <span className="text-slate-500 text-xs pb-0.5">{t('home.streak.count')}</span>
              </div>
              <p
                className={`text-[13px] leading-snug ${
                  stats.currentStreak > 0 ? 'text-orange-300' : 'text-slate-500'
                }`}
              >
                {streakLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mt-3">
            {stats.weeklyDays.map((day, index) => (
              <motion.div
                key={day.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={`text-[9px] ${day.isToday ? 'text-white' : 'text-slate-600'}`}>
                  {t(`home.weekdays.${day.key}`)}
                </span>
                <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                  {day.isToday && (
                    <motion.span
                      animate={{ scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-[#4F8EF7]/35"
                    />
                  )}
                  <span
                    className={`relative w-2 h-2 rounded-full border ${
                      day.completed
                        ? 'bg-[#4F8EF7] border-[#4F8EF7]'
                        : 'bg-transparent border-white/20'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Big CTA button */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.24 }}
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

        {/* Weekly activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 mb-6"
        >
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.16em] mb-3">
            {t('home.weeklyChart.title')}
          </p>

          <div className="grid grid-cols-7 gap-2 items-end">
            {stats.weeklyDays.map((day, index) => {
              const barHeight =
                day.totalSeconds > 0
                  ? 12 + Math.round((day.totalSeconds / maxWeeklySeconds) * 44)
                  : 8;

              return (
                <div key={day.key} className="flex flex-col items-center gap-2">
                  <div className="h-[72px] w-full flex items-end justify-center">
                    <div className="relative w-6 h-full flex items-end justify-center">
                      {day.isToday && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.35 + index * 0.04 }}
                          className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#7CC8FF] shadow-[0_0_10px_rgba(124,200,255,0.9)]"
                        />
                      )}

                      <motion.div
                        initial={{ height: 0, opacity: 0.6 }}
                        animate={{ height: barHeight, opacity: 1 }}
                        transition={{ duration: 0.45, delay: 0.32 + index * 0.05, ease: 'easeOut' }}
                        className={`w-5 rounded-full border ${
                          day.totalSeconds > 0
                            ? day.isToday
                              ? 'bg-gradient-to-t from-[#4F8EF7] to-[#8BD4FF] border-[#8BD4FF]/60 shadow-[0_0_16px_rgba(124,200,255,0.22)]'
                              : 'bg-gradient-to-t from-[#3B6FD4] to-[#68B6FF] border-[#68B6FF]/35'
                            : day.isToday
                              ? 'bg-[#4F8EF7]/20 border-[#7CC8FF]/35'
                              : 'bg-white/[0.05] border-white/10'
                        }`}
                      />
                    </div>
                  </div>

                  <span className={`text-[9px] ${day.isToday ? 'text-white' : 'text-slate-600'}`}>
                    {t(`home.weekdays.${day.key}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Compact progression */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
          className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 mb-6"
        >
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.16em] mb-3">
            {t('journey.progression_title')}
          </p>

          <div className="space-y-2">
            {categoryProgress.map((category, index) => {
              const categoryStyle = CATEGORIES[category.category];
              const completedCount = category.exercises.filter((exercise) => exercise.isCompleted).length;
              const nextExercise = category.exercises.find((exercise) => exercise.isCurrentLevel);
              const isExpanded = expandedCategories.includes(category.category);
              const isGoalCategory = userProfile.goalCategories.includes(category.category);

              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 + index * 0.04 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.category)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-start"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: categoryStyle.color }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-white font-medium truncate">
                          {t(`library.category_${category.category}`)}
                        </span>
                        {isGoalCategory && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#4F8EF7]/12 text-[#7CC8FF] text-[9px] uppercase tracking-[0.08em]">
                            {t('library.recommended_badge')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {t('journey.progression_completed', { count: completedCount })}
                        </span>
                        {nextExercise && (
                          <span className="text-[10px] text-slate-600 truncate">
                            {t('library.up_next')}: {t(`exercises.${exerciseToKey(nextExercise.name)}.name`, { defaultValue: nextExercise.name })}
                          </span>
                        )}
                      </div>
                    </div>

                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-slate-500 shrink-0"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2.5">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: categoryStyle.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(completedCount / Math.max(category.exercises.length, 1)) * 100}%` }}
                              transition={{ duration: 0.35, delay: 0.05 }}
                            />
                          </div>

                          <div className="space-y-1.5">
                            {category.exercises.map((exercise) => {
                              const exerciseName = t(`exercises.${exerciseToKey(exercise.name)}.name`, {
                                defaultValue: exercise.name,
                              });

                              return (
                                <div
                                  key={exercise.id}
                                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white/[0.02]"
                                >
                                  {exercise.isCompleted ? (
                                    <CheckCircle2
                                      className="w-3.5 h-3.5 shrink-0"
                                      style={{ color: categoryStyle.color }}
                                    />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                  )}

                                  <span className={`text-[11px] truncate ${exercise.isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {exerciseName}
                                  </span>

                                  {exercise.isCurrentLevel && !exercise.isCompleted && (
                                    <span className="ms-auto px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[9px] text-[#7CC8FF] shrink-0">
                                      {t('library.up_next')}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Today's status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="flex items-center gap-2 mb-12"
        >
          {loading ? (
            <span className="text-slate-600 text-sm">...</span>
          ) : stats.doneToday ? (
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

        {/* My Journey card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenJourney}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 flex items-center gap-3 mb-8"
        >
          <div className="w-9 h-9 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#4F8EF7]" />
          </div>
          <div className="flex-1 text-start">
            <p className="text-white text-sm font-medium">{t('journey.home_card')}</p>
            <p className="text-slate-500 text-xs">{t('journey.home_card_sub')}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </motion.button>

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

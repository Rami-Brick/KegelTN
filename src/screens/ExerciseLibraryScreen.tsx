import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Star, Sparkles, Dumbbell } from 'lucide-react';
import type { Exercise, UserProfile} from '../services/exercises';
import {
  fetchExercises,
  isRecommended,
  isFeaturedForUser,
  CATEGORIES,
} from '../services/exercises';

interface ExerciseLibraryScreenProps {
  userProfile: UserProfile;
  onBack: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const CATEGORY_ORDER = ['rigidity', 'stamina', 'endurance'];
const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'];

const difficultyDots = (diff: string) => {
  const level = DIFFICULTY_ORDER.indexOf(diff);
  return Array.from({ length: 3 }, (_, i) => i <= level);
};

export default function ExerciseLibraryScreen({
  userProfile,
  onBack,
  onSelectExercise,
}: ExerciseLibraryScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    userProfile.goalCategories[0] ?? 'rigidity'
  );

  useEffect(() => {
    fetchExercises().then((data) => {
      setExercises(data);
      setLoading(false);
    });
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    exercises: exercises.filter((e) => e.category === cat),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {isArabic ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold text-white">{t('library.title')}</h1>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-4 max-w-sm mx-auto">
          {grouped.map((group, groupIdx) => {
            const cat = CATEGORIES[group.key];
            const isExpanded = expandedCategory === group.key;
            const isGoalCategory = userProfile.goalCategories.includes(group.key);

            return (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.1 }}
              >
                {/* Category header — tap to expand/collapse */}
                <button
                  onClick={() => toggleCategory(group.key)}
                  className="w-full rounded-xl p-4 flex items-center gap-3 transition-all"
                  style={{
                    backgroundColor: isExpanded ? cat.colorBg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isExpanded ? cat.color : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    <Dumbbell className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 text-start">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">
                        {t(`library.category_${group.key}`)}
                      </span>
                      {isGoalCategory && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          {t('library.recommended_badge')}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs">
                      {t(`library.category_${group.key}_sub`)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Exercises list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2">
                        {group.exercises.map((exercise, idx) => {
                          const recommended = isRecommended(exercise, userProfile);
                          const featured = isFeaturedForUser(exercise, userProfile);

                          return (
                            <motion.button
                              key={exercise.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => onSelectExercise(exercise)}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full rounded-xl p-4 text-start transition-all ${
                                featured
                                  ? 'bg-white/[0.06] border'
                                  : recommended
                                    ? 'bg-white/[0.03] border border-white/5'
                                    : 'bg-white/[0.02] border border-transparent'
                              }`}
                              style={{
                                borderColor: featured ? `${cat.color}40` : undefined,
                              }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white text-sm font-medium">
                                      {exercise.name}
                                    </span>
                                    {featured && (
                                      <Sparkles
                                        className="w-3.5 h-3.5 shrink-0"
                                        style={{ color: cat.color }}
                                      />
                                    )}
                                    {featured && (
                                      <span
                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: `${cat.color}20`,
                                          color: cat.color,
                                        }}
                                      >
                                        {t('library.featured_badge')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                    {exercise.description}
                                  </p>
                                </div>
                              </div>

                              {/* Bottom row: difficulty dots + sets/reps */}
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    {difficultyDots(exercise.difficulty).map((active, i) => (
                                      <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                          backgroundColor: active
                                            ? cat.color
                                            : 'rgba(255,255,255,0.1)',
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-slate-600 text-[11px]">
                                    {t(`library.difficulty_${exercise.difficulty}`)}
                                  </span>
                                </div>
                                <span className="text-slate-600 text-[11px]">
                                  {t('library.sets_info', {
                                    sets: exercise.sets,
                                    reps: exercise.reps,
                                  })}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
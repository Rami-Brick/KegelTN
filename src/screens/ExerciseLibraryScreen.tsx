import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, Dumbbell, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Exercise, UserProfile, ExerciseWithStatus } from '../services/exercises';
import {
  fetchActiveExercises,
  fetchCompletions,
  computeExerciseStatuses,
  exerciseToKey,
  CATEGORIES,
} from '../services/exercises';

interface ExerciseLibraryScreenProps {
  userId: string;
  userProfile: UserProfile;
  onBack: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const CATEGORY_ORDER = ['rigidity', 'stamina', 'endurance'];

export default function ExerciseLibraryScreen({
  userId,
  userProfile,
  onBack,
  onSelectExercise,
}: ExerciseLibraryScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [exercises, setExercises] = useState<ExerciseWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    userProfile.goalCategories[0] ?? 'rigidity'
  );

  useEffect(() => {
    async function load() {
      const [exList, completions] = await Promise.all([
        fetchActiveExercises(),
        fetchCompletions(userId),
      ]);
      const withStatus = computeExerciseStatuses(exList, completions);
      setExercises(withStatus);
      setLoading(false);
    }
    load();
  }, [userId]);

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
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Header — back always left */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
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
            const completedCount = group.exercises.filter((e) => e.isCompleted).length;

            return (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.1 }}
              >
                {/* Category header */}
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
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">
                        {t(`library.category_${group.key}_sub`)}
                      </span>
                      <span className="text-slate-600 text-[10px]">
                        · {completedCount}/3
                      </span>
                    </div>
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
                        {group.exercises.map((exercise, idx) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            categoryColor={cat.color}
                            index={idx}
                            onSelect={() => onSelectExercise(exercise)}
                          />
                        ))}
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

function ExerciseCard({
  exercise,
  categoryColor,
  index,
  onSelect,
}: {
  exercise: ExerciseWithStatus;
  categoryColor: string;
  index: number;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const key = exerciseToKey(exercise.name);

  const exerciseName = t(`exercises.${key}.name`, { defaultValue: exercise.name });
  const exerciseDesc = t(`exercises.${key}.description`, { defaultValue: exercise.description });
  const phase1 = t(`exercises.${key}.phase1`, { defaultValue: exercise.phase1_label });
  const phase2 = t(`exercises.${key}.phase2`, { defaultValue: exercise.phase2_label });
  const difficultyLabel = t(`difficulty.${exercise.difficulty}`);

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-xl p-4 text-start transition-all relative ${
        exercise.isCompleted
          ? 'bg-white/[0.015] border border-white/[0.03]'
          : exercise.isCurrentLevel
            ? 'bg-white/[0.06] border'
            : 'bg-white/[0.02] border border-white/5'
      }`}
      style={{
        borderColor: exercise.isCurrentLevel ? `${categoryColor}50` : undefined,
        opacity: exercise.isCompleted ? 0.5 : 1,
      }}
    >
      {/* Difficulty label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              backgroundColor: exercise.isCompleted
                ? 'rgba(255,255,255,0.05)'
                : `${categoryColor}15`,
              color: exercise.isCompleted ? 'rgb(100,116,139)' : categoryColor,
            }}
          >
            {difficultyLabel}
          </span>
          {exercise.isCurrentLevel && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
              }}
            >
              <ArrowRight className="w-2.5 h-2.5" />
              {t('library.up_next')}
            </span>
          )}
        </div>
        {exercise.isCompleted && (
          <CheckCircle2 className="w-4 h-4 text-slate-600" />
        )}
      </div>

      {/* Exercise name */}
      <h3
        className={`text-sm font-medium mb-1 ${
          exercise.isCompleted ? 'text-slate-500' : 'text-white'
        }`}
      >
        {exerciseName}
      </h3>

      {/* Description */}
      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">
        {exerciseDesc}
      </p>

      {/* Sets/reps info */}
      <div className="flex items-center justify-between">
        <span className="text-slate-600 text-[11px]">
          {t('library.sets_info', { sets: exercise.sets, reps: exercise.reps })}
        </span>
        {!exercise.isCompleted && (
          <span
            className="text-[11px] font-medium"
            style={{ color: categoryColor }}
          >
            {phase1} / {phase2}
          </span>
        )}
      </div>
    </motion.button>
  );
}
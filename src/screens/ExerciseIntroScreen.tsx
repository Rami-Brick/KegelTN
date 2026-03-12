import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Dumbbell, Play, ChevronLeft } from 'lucide-react';
import { getExerciseMedia } from '../config/media';
import { exerciseToKey } from '../services/exercises';
import type { Exercise } from '../services/exercises';

interface ExerciseIntroScreenProps {
  exercise: Exercise;
  onStart: () => void;
  onBack: () => void;
}

export default function ExerciseIntroScreen({
  exercise,
  onStart,
  onBack,
}: ExerciseIntroScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const media = getExerciseMedia(exercise.name);
  const key = exerciseToKey(exercise.name);

  const exerciseName = t(`exercises.${key}.name`, { defaultValue: exercise.name });
  const exerciseDesc = t(`exercises.${key}.description`, { defaultValue: exercise.description });
  const phase1 = t(`exercises.${key}.phase1`, { defaultValue: exercise.phase1_label });
  const phase2 = t(`exercises.${key}.phase2`, { defaultValue: exercise.phase2_label });
  const difficultyLabel = t(`difficulty.${exercise.difficulty}`);

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-6"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        {/* Media container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full aspect-square max-w-[280px] rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center mb-8 overflow-hidden relative"
        >
          {media ? (
            // Real media content
            media.type === 'gif' || media.type === 'image' ? (
              <img
                src={media.src}
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              // MP4 / WebM
              <video
                src={media.src}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )
          ) : (
            // Animated placeholder
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#4F8EF7]/5 to-transparent"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center"
                >
                  <Dumbbell className="w-8 h-8 text-[#4F8EF7]" />
                </motion.div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Play className="w-3 h-3" />
                  <span>{t('exercise_intro.video_coming')}</span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Exercise name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-white mb-1 text-center"
        >
          {exerciseName}
        </motion.h1>

        {/* Difficulty badge */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-slate-400 mb-4"
        >
          {difficultyLabel}
        </motion.span>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-sm leading-relaxed text-center mb-4"
        >
          {exerciseDesc}
        </motion.p>

        {/* Phase labels preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 mb-10"
        >
          <span className="text-xs px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] font-medium">
            {phase1}
          </span>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-[#34D399]/10 text-[#34D399] font-medium">
            {phase2}
          </span>
          <span className="text-slate-600 text-xs">
            · {exercise.sets} × {exercise.reps}
          </span>
        </motion.div>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-3.5 rounded-xl bg-[#4F8EF7] text-white font-semibold text-base"
        >
          {t('exercise_intro.start')}
        </motion.button>
      </motion.div>
    </div>
  );
}
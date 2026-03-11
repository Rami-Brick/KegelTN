import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

interface ExerciseIntroScreenProps {
  programName: string;
  onStart: () => void;
  onSkip: () => void;
}

export default function ExerciseIntroScreen({
  programName,
  onStart,
  onSkip,
}: ExerciseIntroScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-6"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        {t('exercise_intro.skip')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        {/* Video/GIF placeholder */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full aspect-square max-w-[280px] rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center mb-8 overflow-hidden relative"
        >
          {/* Animated background pulse */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#4F8EF7]/5 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Placeholder icon */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center"
            >
              <Dumbbell className="w-8 h-8 text-[#4F8EF7]" />
            </motion.div>
            <span className="text-slate-500 text-xs">
              {programName}
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-white mb-3 text-center"
        >
          {t('exercise_intro.title')}
        </motion.h1>

        {/* Instruction text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-sm leading-relaxed text-center mb-10"
        >
          {t('exercise_intro.instruction')}
        </motion.p>

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
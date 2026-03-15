import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronLeft, Target, BarChart3, Calendar,
  Sparkles, Dumbbell, Clock, Heart, Globe,
} from 'lucide-react';

type QuizAnswers = Record<number, number>;

interface QuizScreenProps {
  onComplete: (answers: QuizAnswers, program: string) => void;
  initialAnswers?: QuizAnswers;
}

const QUESTIONS = [
  { key: 'q1', options: 4, icon: Calendar },
  { key: 'q2', options: 3, icon: Target },
  { key: 'q3', options: 4, icon: BarChart3 },
  { key: 'q4', options: 4, icon: Dumbbell },
  { key: 'q5', options: 4, icon: Clock },
  { key: 'q6', options: 4, icon: Heart },
];

/**
 * New recommendation algorithm:
 * Q2 (index 1) → categories
 * Q3 (index 2) + Q4 (index 3) → difficulty (combined score 0-6)
 * Q1 (index 0) → age modifier (46+ caps at intermediate)
 */
function deriveProgram(answers: QuizAnswers): string {
  const abilityScore = (answers[2] ?? 0) + (answers[3] ?? 0);
  const age = answers[0] ?? 0;

  let difficulty: string;
  if (abilityScore <= 2) difficulty = 'beginner';
  else if (abilityScore <= 4) difficulty = 'intermediate';
  else difficulty = 'advanced';

  // Age safety cap: 46+ cannot start at advanced
  if (age === 3 && difficulty === 'advanced') {
    difficulty = 'intermediate';
  }

  return difficulty;
}

const ICON_COLORS = ['#4F8EF7', '#EF4444', '#F97316', '#34D399', '#8B5CF6', '#EC4899'];

export default function QuizScreen({ onComplete, initialAnswers }: QuizScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers ?? {});
  const [direction, setDirection] = useState(1);
  const [showResults, setShowResults] = useState(false);

  const total = QUESTIONS.length;
  const progress = ((step + 1) / total) * 100;
  const currentQ = QUESTIONS[step];
  const selectedOption = answers[step];
  const IconComponent = currentQ.icon;
  const iconColor = ICON_COLORS[step];

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [step]: optionIndex }));
  };

  const next = () => {
    if (selectedOption === undefined) return;
    setDirection(1);
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setShowResults(true);
    }
  };

  const back = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    setDirection(-1);
    if (step > 0) setStep((s) => s - 1);
  };

  const program = deriveProgram(answers);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-[#4F8EF7]/10 flex items-center justify-center mb-6"
          >
            <Sparkles className="w-10 h-10 text-[#4F8EF7]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2 text-center"
          >
            {t('quiz.results.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-sm mb-8 text-center"
          >
            {t('quiz.results.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
          >
            <p className="text-center text-[#4F8EF7] text-sm font-medium mb-1">
              {t('quiz.results.subtitle')}
            </p>
            <p className="text-center text-white text-2xl font-bold">
              {t('quiz.results.program', {
                program: t(`quiz.results.${program}`),
              })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-sm space-y-3 mb-10"
          >
            {[
              { icon: Target, text: t('quiz.results.insight1') },
              { icon: BarChart3, text: t('quiz.results.insight2') },
              { icon: Calendar, text: t('quiz.results.insight3') },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
              >
                <item.icon className="w-5 h-5 text-[#34D399] shrink-0" />
                <span className="text-slate-300 text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-sm space-y-3"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onComplete(answers, program)}
              className="w-full py-3.5 rounded-xl bg-[#4F8EF7] text-white font-semibold text-base"
            >
              {t('quiz.results.start')}
            </motion.button>
            <button
              onClick={back}
              className="w-full py-3 text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              {t('quiz.back')}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={back}
            disabled={step === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-slate-500 text-sm">
            {t('quiz.progress', { current: step + 1, total })}
          </span>
          <button
            onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{isArabic ? 'EN' : 'عربي'}</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#4F8EF7] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col px-6 pt-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: `${iconColor}15` }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <IconComponent className="w-7 h-7" style={{ color: iconColor }} />
              </motion.div>
            </motion.div>

            {/* Title & subtitle */}
            <h1 className="text-2xl font-bold text-white mb-2">
              {t(`quiz.${currentQ.key}.title`)}
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              {t(`quiz.${currentQ.key}.subtitle`)}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {Array.from({ length: currentQ.options }, (_, i) => {
                const isSelected = selectedOption === i;
                return (
                  <motion.button
                    key={i}
                    onClick={() => selectOption(i)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-start transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#4F8EF7]/10 border-[#4F8EF7] text-white'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isSelected
                          ? 'border-[#4F8EF7] bg-[#4F8EF7]'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm leading-snug">
                      {t(`quiz.${currentQ.key}.o${i + 1}`)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-8 pt-4">
        <motion.button
          onClick={next}
          disabled={selectedOption === undefined}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-xl bg-[#4F8EF7] text-white font-semibold text-base disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          {t('quiz.next')}
        </motion.button>
      </div>
    </div>
  );
}
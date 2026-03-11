import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Clock, Repeat, HelpCircle } from 'lucide-react';

type Phase = 'contract' | 'relax';
type TimerState = 'idle' | 'running' | 'paused' | 'completed';

interface ProgramConfig {
  id: string;
  contractSec: number;
  relaxSec: number;
  reps: number;
}

interface TimerScreenProps {
  program: ProgramConfig;
  onQuit: () => void;
  onComplete: (durationSec: number, reps: number) => void;
  onShowTutorial: () => void;
}

const PROGRAMS: Record<string, ProgramConfig> = {
  beginner: { id: 'beginner', contractSec: 3, relaxSec: 3, reps: 10 },
  intermediate: { id: 'intermediate', contractSec: 5, relaxSec: 5, reps: 10 },
  advanced: { id: 'advanced', contractSec: 10, relaxSec: 10, reps: 10 },
};

const RING_SIZE = 260;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CONTRACT_COLOR = '#EF4444';
const RELAX_COLOR = '#34D399';

export { PROGRAMS };

export default function TimerScreen({ program, onQuit, onComplete, onShowTutorial }: TimerScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [phase, setPhase] = useState<Phase>('contract');
  const [timeLeft, setTimeLeft] = useState(program.contractSec);
  const [currentRep, setCurrentRep] = useState(1);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseDuration = phase === 'contract' ? program.contractSec : program.relaxSec;
  const progress = timeLeft / phaseDuration;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const phaseColor = phase === 'contract' ? CONTRACT_COLOR : RELAX_COLOR;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const completeWorkout = useCallback(() => {
    clearTimer();
    const totalSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimerState('completed');
    setShowComplete(true);
    onComplete(totalSec, program.reps);
  }, [clearTimer, onComplete, program.reps]);

  const advancePhase = useCallback(() => {
    if (phase === 'contract') {
      setPhase('relax');
      setTimeLeft(program.relaxSec);
    } else {
      if (currentRep >= program.reps) {
        completeWorkout();
        return;
      }
      setCurrentRep((r) => r + 1);
      setPhase('contract');
      setTimeLeft(program.contractSec);
    }
  }, [phase, currentRep, program, completeWorkout]);

  useEffect(() => {
    if (timerState !== 'running') return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [timerState, advancePhase, clearTimer]);

  const togglePause = () => {
    if (timerState === 'idle') {
      startTimeRef.current = Date.now();
      setTimerState('running');
    } else if (timerState === 'running') {
      setTimerState('paused');
      clearTimer();
    } else if (timerState === 'paused') {
      setTimerState('running');
    }
  };

  const handleQuit = () => {
    clearTimer();
    setShowQuitModal(true);
  };

  const confirmQuit = () => {
    onQuit();
  };

  const cancelQuit = () => {
    setShowQuitModal(false);
    if (timerState !== 'completed') {
      setTimerState('running');
    }
  };

  // Completion screen
  if (showComplete) {
    const totalSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    return (
      <div
        className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-6"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-[#34D399]/10 flex items-center justify-center mb-6"
        >
          <Trophy className="w-10 h-10 text-[#34D399]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {t('timer.complete_title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-sm mb-8"
        >
          {t('timer.complete_subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-6 mb-10"
        >
          <div className="flex flex-col items-center gap-2 bg-white/5 rounded-2xl px-6 py-4">
            <Clock className="w-5 h-5 text-[#4F8EF7]" />
            <span className="text-white font-bold text-lg">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            <span className="text-slate-500 text-xs">{t('timer.complete_duration')}</span>
          </div>
          <div className="flex flex-col items-center gap-2 bg-white/5 rounded-2xl px-6 py-4">
            <Repeat className="w-5 h-5 text-[#4F8EF7]" />
            <span className="text-white font-bold text-lg">{program.reps}</span>
            <span className="text-slate-500 text-xs">{t('timer.complete_reps')}</span>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={onQuit}
          className="w-full max-w-sm py-3.5 rounded-xl bg-[#4F8EF7] text-white font-semibold text-base"
        >
          {t('timer.complete_done')}
        </motion.button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col items-center relative"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Quit button */}
      <button
        onClick={handleQuit}
        className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Rep counter */}
      <div className="pt-6">
        <span className="text-slate-500 text-sm">
          {t('timer.rep', { current: currentRep, total: program.reps })}
        </span>
      </div>

      {/* Main ring area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Phase label above ring */}
        <div className="h-8 mb-6">
          {timerState !== 'idle' && (
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold tracking-wide uppercase"
                style={{ color: phaseColor }}
              >
                {t(`timer.${phase}`)}
              </motion.p>
            </AnimatePresence>
          )}
        </div>

        {/* Circular progress ring — tap to pause/resume */}
        <button
          onClick={togglePause}
          className="relative focus:outline-none"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow:
                timerState === 'running'
                  ? `0 0 40px ${phaseColor}20, 0 0 80px ${phaseColor}10`
                  : 'none',
            }}
            transition={{ duration: 0.5 }}
          />

          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="transform -rotate-90"
          >
            {/* Track */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Progress */}
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={phaseColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              animate={{ strokeDashoffset: dashOffset, stroke: phaseColor }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {timerState === 'idle' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <span className="text-white text-xl font-bold mb-1">
                  {t('timer.ready')}
                </span>
                <span className="text-slate-500 text-xs">
                  {t('timer.tap_to_start')}
                </span>
              </motion.div>
            ) : timerState === 'paused' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <span className="text-slate-400 text-base font-medium">
                  {t('timer.paused')}
                </span>
                <span className="text-slate-600 text-xs mt-1">
                  {t('timer.pause')}
                </span>
              </motion.div>
            ) : (
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="text-6xl font-bold text-white"
              >
                {timeLeft}
              </motion.span>
            )}
          </div>
        </button>
      </div>

      {/* Tutorial link */}
      <div className="pb-8">
        <button
          onClick={onShowTutorial}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors mx-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-xs underline">{t('timer.show_tutorial')}</span>
        </button>
      </div>

      {/* Quit confirmation modal */}
      <AnimatePresence>
        {showQuitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center px-6 z-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#141A2E] border border-white/10 rounded-2xl p-6"
            >
              <p className="text-white text-lg font-semibold text-center mb-6">
                {t('timer.quit_confirm')}
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={cancelQuit}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium text-sm"
                >
                  {t('timer.quit_no')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmQuit}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium text-sm"
                >
                  {t('timer.quit_yes')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Timer, RotateCcw, Repeat, Clock, Play } from 'lucide-react';

interface WorkoutScreenProps {
  recommendedProgram: string;
  onBack: () => void;
  onStartProgram: (programId: string) => void;
}

const PROGRAMS = [
  {
    id: 'beginner',
    color: '#34D399',
    colorBg: 'rgba(52, 211, 153, 0.08)',
    colorBorder: 'rgba(52, 211, 153, 0.2)',
    contractSec: 3,
    relaxSec: 3,
    reps: 10,
    durationMin: 2,
  },
  {
    id: 'intermediate',
    color: '#4F8EF7',
    colorBg: 'rgba(79, 142, 247, 0.08)',
    colorBorder: 'rgba(79, 142, 247, 0.2)',
    contractSec: 5,
    relaxSec: 5,
    reps: 10,
    durationMin: 3,
  },
  {
    id: 'advanced',
    color: '#EC4899',
    colorBg: 'rgba(236, 72, 153, 0.08)',
    colorBorder: 'rgba(236, 72, 153, 0.2)',
    contractSec: 10,
    relaxSec: 10,
    reps: 10,
    durationMin: 5,
  },
];

export default function WorkoutScreen({
  recommendedProgram,
  onBack,
  onStartProgram,
}: WorkoutScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] flex flex-col"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {isArabic ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
          <h1 className="text-xl font-bold text-white">{t('workout.title')}</h1>
        </div>
      </div>

      {/* Program cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-4 max-w-sm mx-auto">
          {PROGRAMS.map((program, index) => {
            const isRecommended = program.id === recommendedProgram;

            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* Recommended badge */}
                {isRecommended && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 mb-2 ms-1"
                  >
                    <Star
                      className="w-3.5 h-3.5"
                      style={{ color: program.color }}
                      fill={program.color}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: program.color }}
                    >
                      {t('workout.recommended')}
                    </span>
                  </motion.div>
                )}

                <div
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    backgroundColor: program.colorBg,
                    border: `1px solid ${isRecommended ? program.color : program.colorBorder}`,
                    boxShadow: isRecommended
                      ? `0 0 20px ${program.colorBg}`
                      : 'none',
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white">
                      {t(`workout.${program.id}`)}
                    </h2>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              i <= index
                                ? program.color
                                : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-400 text-sm mb-4">
                    {t(`workout.${program.id}_desc`)}
                  </p>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
                    {[
                      {
                        icon: Timer,
                        text: t('workout.contract', { sec: program.contractSec }),
                      },
                      {
                        icon: RotateCcw,
                        text: t('workout.relax', { sec: program.relaxSec }),
                      },
                      {
                        icon: Repeat,
                        text: t('workout.reps', { count: program.reps }),
                      },
                      {
                        icon: Clock,
                        text: t('workout.duration', { min: program.durationMin }),
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5"
                      >
                        <stat.icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          {stat.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Start button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onStartProgram(program.id)}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: isRecommended
                        ? program.color
                        : 'rgba(255,255,255,0.05)',
                      color: isRecommended ? '#fff' : program.color,
                    }}
                  >
                    <Play className="w-4 h-4" />
                    {t('workout.start')}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
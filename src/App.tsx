import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange } from './services/auth';
import { supabase } from './lib/supabase';
import LoginScreen from './screens/LoginScreen';
import QuizScreen from './screens/QuizScreen';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import ExerciseIntroScreen from './screens/ExerciseIntroScreen';
import TimerScreen, { PROGRAMS } from './screens/TimerScreen';

type AppState = 'loading' | 'login' | 'quiz' | 'home' | 'workout' | 'exercise-intro' | 'timer';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [session, setSession] = useState<any>(null);
  const [recommendedProgram, setRecommendedProgram] = useState('beginner');
  const [selectedProgram, setSelectedProgram] = useState('beginner');

  useEffect(() => {
    getSession().then(async (s) => {
      if (!s) {
        setAppState('login');
        return;
      }
      setSession(s);

      const { data } = await supabase
        .from('quiz_results')
        .select('id, recommended_program')
        .eq('user_id', s.user.id)
        .maybeSingle();

      if (data) {
        setRecommendedProgram(data.recommended_program);
        setAppState('home');
      } else {
        setAppState('quiz');
      }
    });

    const { data: listener } = onAuthStateChange(async (s) => {
      if (!s) {
        setSession(null);
        setAppState('login');
        return;
      }
      setSession(s);

      const { data } = await supabase
        .from('quiz_results')
        .select('id, recommended_program')
        .eq('user_id', s.user.id)
        .maybeSingle();

      if (data) {
        setRecommendedProgram(data.recommended_program);
        setAppState('home');
      } else {
        setAppState('quiz');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleQuizComplete = async (answers: Record<number, number>, program: string) => {
    if (!session) return;

    await supabase.from('quiz_results').insert({
      user_id: session.user.id,
      answers,
      recommended_program: program,
    });

    setRecommendedProgram(program);
    setAppState('home');
  };

  const handleStartProgram = (programId: string) => {
    setSelectedProgram(programId);
    setAppState('exercise-intro');
  };

  const handleWorkoutComplete = async (durationSec: number, reps: number) => {
    if (!session) return;

    await supabase.from('workouts').insert({
      user_id: session.user.id,
      program: selectedProgram,
      duration_seconds: durationSec,
    });
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (appState === 'login') return <LoginScreen />;
  if (appState === 'quiz') return <QuizScreen onComplete={handleQuizComplete} />;

  if (appState === 'workout')
    return (
      <WorkoutScreen
        recommendedProgram={recommendedProgram}
        onBack={() => setAppState('home')}
        onStartProgram={handleStartProgram}
      />
    );

  if (appState === 'exercise-intro')
    return (
      <ExerciseIntroScreen
        programName={selectedProgram.charAt(0).toUpperCase() + selectedProgram.slice(1)}
        onStart={() => setAppState('timer')}
        onSkip={() => setAppState('timer')}
      />
    );

  if (appState === 'timer')
    return (
      <TimerScreen
        program={PROGRAMS[selectedProgram]}
        onQuit={() => setAppState('home')}
        onComplete={handleWorkoutComplete}
        onShowTutorial={() => setAppState('exercise-intro')}
      />
    );

  return (
    <HomeScreen
      userId={session.user.id}
      onStartWorkout={() => setAppState('workout')}
    />
  );
}

export default App;
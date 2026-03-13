import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange } from './services/auth';
import { supabase } from './lib/supabase';
import { deriveUserProfile, markExerciseComplete } from './services/exercises';
import type { Exercise, UserProfile } from './services/exercises';
import LoginScreen from './screens/LoginScreen';
import QuizScreen from './screens/QuizScreen';
import HomeScreen from './screens/HomeScreen';
import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen';
import ExerciseIntroScreen from './screens/ExerciseIntroScreen';
import JourneyScreen from './screens/JourneyScreen';
import TimerScreen from './screens/TimerScreen';

type AppState = 'loading' | 'login' | 'quiz' | 'home' | 'library' | 'exercise-intro' | 'timer' | 'journey';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    goalCategories: ['rigidity', 'stamina', 'endurance'],
    difficulty: 'beginner',
  });
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const loadUserData = async (s: any) => {
    const { data } = await supabase
      .from('quiz_results')
      .select('id, recommended_program, answers')
      .eq('user_id', s.user.id)
      .maybeSingle();

    if (data) {
      const profile = deriveUserProfile(data.answers as Record<number, number>);
      setUserProfile(profile);
      setAppState('home');
    } else {
      setAppState('quiz');
    }
  };

  useEffect(() => {
    getSession().then(async (s) => {
      if (!s) {
        setAppState('login');
        return;
      }
      setSession(s);
      await loadUserData(s);
    });

    const { data: listener } = onAuthStateChange(async (s) => {
      if (!s) {
        setSession(null);
        setAppState('login');
        return;
      }
      setSession(s);
      await loadUserData(s);
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

    const profile = deriveUserProfile(answers);
    setUserProfile(profile);
    setAppState('home');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setAppState('exercise-intro');
  };

  const handleWorkoutComplete = async (durationSec: number) => {
    if (!session || !selectedExercise) return;

    await supabase.from('workouts').insert({
      user_id: session.user.id,
      program: selectedExercise.id,
      duration_seconds: durationSec,
    });

    // Mark this exercise as completed for progression
    await markExerciseComplete(session.user.id, selectedExercise.id);
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

  if (appState === 'library')
    return (
      <ExerciseLibraryScreen
        userId={session.user.id}
        userProfile={userProfile}
        onBack={() => setAppState('home')}
        onSelectExercise={handleSelectExercise}
      />
    );

  if (appState === 'exercise-intro' && selectedExercise)
    return (
      <ExerciseIntroScreen
        exercise={selectedExercise}
        onStart={() => setAppState('timer')}
        onBack={() => setAppState('library')}
      />
    );

  if (appState === 'timer' && selectedExercise)
    return (
      <TimerScreen
        program={{
          id: selectedExercise.id,
          name: selectedExercise.name,
          contractSec: selectedExercise.phase1_seconds,
          relaxSec: selectedExercise.phase2_seconds,
          reps: selectedExercise.reps,
          sets: selectedExercise.sets,
          restSeconds: selectedExercise.rest_seconds,
          phase1Label: selectedExercise.phase1_label,
          phase2Label: selectedExercise.phase2_label,
        }}
        onQuit={() => setAppState('home')}
        onComplete={handleWorkoutComplete}
        onShowTutorial={() => setAppState('exercise-intro')}
      />
    );

  if (appState === 'journey')
    return (
      <JourneyScreen
        userId={session.user.id}
        userProfile={userProfile}
        onBack={() => setAppState('home')}
      />
    );

  return (
    <HomeScreen
      userId={session.user.id}
      onStartWorkout={() => setAppState('library')}
      onOpenJourney={() => setAppState('journey')}
    />
  );
}

export default App;
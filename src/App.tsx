import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange } from './services/auth';
import { supabase } from './lib/supabase';
import LoginScreen from './screens/LoginScreen';
import QuizScreen from './screens/QuizScreen';

function HomeScreen() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <h1 className="text-white text-2xl">Welcome! You're logged in.</h1>
    </div>
  );
}

type AppState = 'loading' | 'login' | 'quiz' | 'home';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    getSession().then(async (s) => {
      if (!s) {
        setAppState('login');
        return;
      }
      setSession(s);

      // Check if quiz is completed
      const { data } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('user_id', s.user.id)
        .maybeSingle();

      setAppState(data ? 'home' : 'quiz');
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
        .select('id')
        .eq('user_id', s.user.id)
        .maybeSingle();

      setAppState(data ? 'home' : 'quiz');
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

    setAppState('home');
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
  return <HomeScreen />;
}

export default App;
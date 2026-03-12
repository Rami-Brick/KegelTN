import { supabase } from '../lib/supabase';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  phase1_label: string;
  phase2_label: string;
  phase1_seconds: number;
  phase2_seconds: number;
  reps: number;
  sets: number;
  rest_seconds: number;
  description: string;
  featured: boolean;
  sort_order: number;
}

export interface UserProfile {
  goalCategories: string[];   // ['rigidity', 'stamina', 'endurance']
  difficulty: string;         // 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Derive user profile from quiz answers
 * 
 * Quiz answer indices (0-based):
 * Q2 (index 1): 0 = Stronger erections, 1 = Last longer, 2 = Both
 * Q4-Q7 (index 3-6): 0 = worst, 3 = best (ability scores)
 */
export function deriveUserProfile(answers: Record<number, number>): UserProfile {
  // Map goal from Q2
  const goalAnswer = answers[1] ?? 2;
  let goalCategories: string[];

  if (goalAnswer === 0) {
    goalCategories = ['rigidity'];
  } else if (goalAnswer === 1) {
    goalCategories = ['stamina', 'endurance'];
  } else {
    goalCategories = ['rigidity', 'stamina', 'endurance'];
  }

  // Derive difficulty from Q4-Q7 (ability scores)
  const abilityScore =
    (answers[3] ?? 0) + (answers[4] ?? 0) + (answers[5] ?? 0) + (answers[6] ?? 0);

  let difficulty: string;
  if (abilityScore <= 4) {
    difficulty = 'beginner';
  } else if (abilityScore <= 8) {
    difficulty = 'intermediate';
  } else {
    difficulty = 'advanced';
  }

  return { goalCategories, difficulty };
}

/**
 * Check if an exercise is recommended for this user
 */
export function isRecommended(exercise: Exercise, profile: UserProfile): boolean {
  return (
    profile.goalCategories.includes(exercise.category) &&
    exercise.difficulty === profile.difficulty
  );
}

/**
 * Check if an exercise is the featured/star pick for this user
 */
export function isFeaturedForUser(exercise: Exercise, profile: UserProfile): boolean {
  return isRecommended(exercise, profile) && exercise.featured;
}

/**
 * Fetch all exercises from Supabase
 */
export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('category')
    .order('difficulty')
    .order('sort_order');

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Category display info
 */
export const CATEGORIES: Record<string, { color: string; colorBg: string; colorBorder: string }> = {
  rigidity: {
    color: '#EF4444',
    colorBg: 'rgba(239, 68, 68, 0.08)',
    colorBorder: 'rgba(239, 68, 68, 0.2)',
  },
  stamina: {
    color: '#34D399',
    colorBg: 'rgba(52, 211, 153, 0.08)',
    colorBorder: 'rgba(52, 211, 153, 0.2)',
  },
  endurance: {
    color: '#4F8EF7',
    colorBg: 'rgba(79, 142, 247, 0.08)',
    colorBorder: 'rgba(79, 142, 247, 0.2)',
  },
};
import { supabase } from '../lib/supabase';
import { ACTIVE_EXERCISES } from '../config/exercises';

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
  goalCategories: string[];
  difficulty: string;
}

export interface ExerciseWithStatus extends Exercise {
  isCompleted: boolean;
  isCurrentLevel: boolean;  // the next one to do in progression
}

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'];

/**
 * Derive user profile from quiz answers
 */
export function deriveUserProfile(answers: Record<number, number>): UserProfile {
  const goalAnswer = answers[1] ?? 2;
  let goalCategories: string[];

  if (goalAnswer === 0) {
    goalCategories = ['rigidity'];
  } else if (goalAnswer === 1) {
    goalCategories = ['stamina', 'endurance'];
  } else {
    goalCategories = ['rigidity', 'stamina', 'endurance'];
  }

  const abilityScore =
    (answers[3] ?? 0) + (answers[4] ?? 0) + (answers[5] ?? 0) + (answers[6] ?? 0);

  let difficulty: string;
  if (abilityScore <= 4) difficulty = 'beginner';
  else if (abilityScore <= 8) difficulty = 'intermediate';
  else difficulty = 'advanced';

  return { goalCategories, difficulty };
}

/**
 * Fetch only the active (configured) exercises from Supabase
 */
export async function fetchActiveExercises(): Promise<Exercise[]> {
  // Collect all active exercise names
  const activeNames: string[] = [];
  for (const cat of Object.values(ACTIVE_EXERCISES)) {
    activeNames.push(cat.beginner, cat.intermediate, cat.advanced);
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .in('name', activeNames);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Fetch which exercises the user has completed
 */
export async function fetchCompletions(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('exercise_completions')
    .select('exercise_id')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.exercise_id));
}

/**
 * Mark an exercise as completed
 */
export async function markExerciseComplete(userId: string, exerciseId: string) {
  const { error } = await supabase
    .from('exercise_completions')
    .upsert({ user_id: userId, exercise_id: exerciseId }, { onConflict: 'user_id,exercise_id' });

  if (error) throw new Error(error.message);
}

/**
 * Given exercises and completions, compute status for each exercise per category
 * 
 * For each category:
 * - Completed exercises are marked isCompleted = true
 * - The first non-completed exercise (in difficulty order) is isCurrentLevel = true
 * - Others are neither
 */
export function computeExerciseStatuses(
  exercises: Exercise[],
  completions: Set<string>
): ExerciseWithStatus[] {
  const result: ExerciseWithStatus[] = [];

  const categories = Object.keys(ACTIVE_EXERCISES);

  for (const cat of categories) {
    const catExercises = exercises
      .filter((e) => e.category === cat)
      .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty));

    let foundCurrent = false;

    for (const exercise of catExercises) {
      const isCompleted = completions.has(exercise.id);
      let isCurrentLevel = false;

      if (!isCompleted && !foundCurrent) {
        isCurrentLevel = true;
        foundCurrent = true;
      }

      result.push({ ...exercise, isCompleted, isCurrentLevel });
    }
  }

  return result;
}

/**
 * Convert exercise name to translation key
 * e.g., "Pelvic Tilt" → "pelvic_tilt"
 * e.g., "90 to 90 Advanced" → "90_to_90_advanced"
 */
export function exerciseToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
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
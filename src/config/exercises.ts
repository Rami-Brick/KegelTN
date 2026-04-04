/**
 * Exercise selection config
 * 
 * Pick exactly ONE exercise per difficulty level per category.
 * Use the exact exercise name from the database.
 * To swap an exercise, just change the name here — no other code changes needed.
 */

export const ACTIVE_EXERCISES: Record<string, { beginner: string; intermediate: string; advanced: string }> = {
  rigidity: {
    beginner: 'Pelvic Tilt',
    intermediate: 'Heel Glute Bridge',
    advanced: 'Rear Decline Bridge',
  },
  stamina: {
    beginner: 'Child Pose',
    intermediate: 'Lying Butterfly',
    advanced: '90 to 90 Advanced',
  },
  endurance: {
    beginner: 'Kneeling Ab Draw In',
    intermediate: 'Glute March',
    advanced: 'Squat Side Bends',
  },
};
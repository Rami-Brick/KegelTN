/**
 * Exercise media config
 * 
 * Map exercise names to their demo media files.
 * Supports: GIF, MP4, WebM, or any image format.
 * 
 * To add media:
 * 1. Drop the file in src/assets/exercises/
 * 2. Import it below
 * 3. Add the mapping
 * 
 * Example:
 *   import pelvicTiltGif from '../assets/exercises/pelvic-tilt.gif';
 *   'Pelvic Tilt': { src: pelvicTiltGif, type: 'gif' },
 */
import ninety from '../assets/gifs/ninety.gif'
import childpose from '../assets/gifs/childpose.gif'
import glutemarch from '../assets/gifs/glutemarch.gif'
import heelglutebridge from '../assets/gifs/heelglutebridge.gif'
import kneelingabdrawin from '../assets/gifs/kneelingabdrawin.gif'
import lyingbutterfly from '../assets/gifs/lyingbutterfly.gif'
import pelvictilt from '../assets/gifs/pelvictilt.gif'
import reardeclinebridge from '../assets/gifs/reardeclinebridge.gif'
import squatsidebends from '../assets/gifs/squatsidebends.gif'

interface MediaEntry {
  src: string;
  type: 'gif' | 'mp4' | 'webm' | 'image';
}

export const EXERCISE_MEDIA: Record<string, MediaEntry> = {
  '90 to 90 Advanced': { src: ninety, type: 'gif' },
  'Child Pose': { src: childpose, type: 'gif' },
  'Glute March': { src: glutemarch, type: 'gif' },
  'Heel Glute Bridge': { src: heelglutebridge, type: 'gif' },
  'Kneeling Ab Draw In': { src: kneelingabdrawin, type: 'gif' },
  'Lying Butterfly': { src: lyingbutterfly, type: 'gif' },
  'Pelvic Tilt': { src: pelvictilt, type: 'gif' },
  'Rear Decline Bridge': { src: reardeclinebridge, type: 'gif' },
  'Squat Side Bends': { src: squatsidebends, type: 'gif' },
};

/**
 * Get media for an exercise, returns null if none configured
 */
export function getExerciseMedia(exerciseName: string): MediaEntry | null {
  return EXERCISE_MEDIA[exerciseName] ?? null;
}
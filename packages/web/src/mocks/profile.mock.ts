import type { UserProfile } from '@coach/shared';

/**
 * Mock user profile for Phase 6.
 * Replaced by real API in Phase 7.
 */
export const mockProfile: UserProfile = {
  schema_version: '1.0.0',
  display_name: 'Dany',
  age: 30,
  height_cm: 178,
  weight_kg: 76,
  experience_level: 'intermediate',
  goals: ['Force sur bench/squat/deadlift', 'Maintenir composition corporelle'],
  equipment: ['barbell', 'dumbbells', 'rack', 'bench', 'cable', 'pullup-bar'],
  injuries: [],
  one_rep_max_kg: {
    'bench-press': 105,
    squat: 130,
    deadlift: 150,
  },
  weight_unit_preference: 'kg',
  updated_at: '2026-04-22T10:00:00.000Z',
};

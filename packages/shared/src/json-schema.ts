import { z } from 'zod';
import { WorkoutProgram } from './schemas/program.js';
import { UserProfile } from './schemas/profile.js';
import { SessionReport } from './schemas/report.js';
import { SCHEMA_VERSION } from './schemas/version.js';

export interface SchemaPayload {
  schema_version: string;
  generated_at: string;
  schemas: {
    WorkoutProgram: unknown;
    UserProfile: unknown;
    SessionReport: unknown;
  };
  examples: {
    WorkoutProgram: unknown;
    UserProfile: unknown;
  };
  notes: string[];
}

const exampleWorkoutProgram = {
  schema_version: '1.0.0',
  program: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Force & hypertrophie — Bloc 1',
    generated_at: '2026-05-03T10:00:00Z',
    generated_by: 'claude-opus-4-7',
    goal: 'strength',
    notes: '4 séances/semaine sur 8 semaines. Progression linéaire.',
    duration_weeks: 8,
    sessions_per_week: 4,
  },
  sessions: [
    {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      session_number: 1,
      name: 'Jour A — Push',
      scheduled_weekday: 'monday',
      estimated_duration_minutes: 65,
      tags: ['push', 'chest', 'shoulders', 'triceps'],
      warmup: { duration_minutes: 10, instructions: '5min cardio + mobilité épaules.' },
      blocks: [
        {
          id: 'b1',
          name: 'Force principale',
          type: 'strength',
          notes: 'Focus technique.',
          exercises: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              order: 1,
              name: 'Développé couché barre',
              category: 'compound',
              muscle_groups_primary: ['pectoraux', 'deltoïdes antérieurs'],
              muscle_groups_secondary: ['triceps'],
              equipment: ['barbell', 'bench', 'rack'],
              sets: [
                {
                  set_number: 1,
                  type: 'warmup',
                  reps: 10,
                  reps_min: null,
                  reps_max: null,
                  weight_kg: 40,
                  weight_unit: 'kg',
                  rpe_target: null,
                  duration_seconds: null,
                  rest_seconds: 90,
                  notes: 'Activation',
                },
                {
                  set_number: 2,
                  type: 'working',
                  reps: 5,
                  reps_min: null,
                  reps_max: null,
                  weight_kg: 80,
                  weight_unit: 'kg',
                  rpe_target: 8,
                  duration_seconds: null,
                  rest_seconds: 210,
                  notes: '',
                },
                {
                  set_number: 3,
                  type: 'working',
                  reps: 5,
                  reps_min: null,
                  reps_max: null,
                  weight_kg: 80,
                  weight_unit: 'kg',
                  rpe_target: 8,
                  duration_seconds: null,
                  rest_seconds: 210,
                  notes: '',
                },
                {
                  set_number: 4,
                  type: 'amrap',
                  reps: null,
                  reps_min: 3,
                  reps_max: null,
                  weight_kg: 80,
                  weight_unit: 'kg',
                  rpe_target: 9,
                  duration_seconds: null,
                  rest_seconds: 240,
                  notes: 'Stop à RIR 1',
                },
              ],
              coaching_cues: [
                'Rétracte les omoplates avant de saisir la barre',
                'Arc lombaire contrôlé, pieds à plat',
                'Descente contrôlée 2-3 secondes',
              ],
              progression_note: '+2.5kg si tous les sets complétés en RIR 1+',
              video_url: null,
              alternatives: [{ name: 'Développé couché haltères', reason: 'Si rack pris' }],
            },
          ],
        },
      ],
      cooldown: { duration_minutes: 5, instructions: 'Étirements pectoraux + épaules.' },
    },
  ],
};

const exampleUserProfile = {
  schema_version: '1.0.0',
  display_name: 'Dany',
  age: 30,
  height_cm: 180,
  weight_kg: 78,
  experience_level: 'intermediate',
  goals: ['strength', 'hypertrophy'],
  equipment: ['barbell', 'rack', 'bench', 'dumbbells', 'pulley'],
  injuries: [],
  one_rep_max_kg: { bench: 100, squat: 140, deadlift: 180, ohp: 65 },
  weight_unit_preference: 'kg',
  // Server stamps updated_at on push; included here so the example is valid
  // against the standalone JSON Schema (call sites can drop it before push).
  updated_at: '2026-05-03T10:00:00Z',
};

export function buildSchemaPayload(): SchemaPayload {
  return {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    schemas: {
      WorkoutProgram: z.toJSONSchema(WorkoutProgram),
      UserProfile: z.toJSONSchema(UserProfile),
      SessionReport: z.toJSONSchema(SessionReport),
    },
    examples: {
      WorkoutProgram: exampleWorkoutProgram,
      UserProfile: exampleUserProfile,
    },
    notes: [
      'Tous les UUIDs sont v4 stricts (regex Zod). Génère via crypto.randomUUID() ou équivalent RFC 4122 v4.',
      'IsoDate accepte le suffixe Z ou un offset explicite (+02:00).',
      'schema_version doit être exactement "1.0.0" (literal). Le serveur rejette toute autre valeur.',
      'Pour les sets warmup, mets rpe_target à null. Working sets: RPE 7-9.',
      'rest_seconds par type: force 180-240, hypertrophie 60-120, isolation 45-75, supersets 60-90 entre rounds seulement.',
      'Tout exercice principal: au moins 1 set warmup explicite avant les working sets.',
      "alternatives est un tableau d'objets {name, reason?}, pas de strings.",
      'Bornes string: name 200, notes 2000, instructions 5000, coaching_cues 500. Le serveur rejette si dépassé.',
      'tags / equipment / goals: tableaux de strings courtes (max 80 chars/élément).',
      "UserProfile.updated_at est stampé par le serveur lors de update_profile — tu peux l'omettre dans le payload poussé.",
    ],
  };
}

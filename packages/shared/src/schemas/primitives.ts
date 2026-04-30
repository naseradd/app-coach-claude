import { z } from 'zod';

export const Uuid = z.string().uuid();
export const IsoDate = z.string().datetime({ offset: true });
export const WeightUnit = z.enum(['kg', 'lbs']);
export const Rpe = z.number().min(1).max(10);
export const Weekday = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

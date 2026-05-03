import { describe, it, expect } from 'vitest';
import { buildSchemaPayload } from '@coach/shared';

describe('schema endpoint', () => {
  it('buildSchemaPayload returns expected shape', () => {
    const p = buildSchemaPayload();
    expect(p.schema_version).toBe('1.0.0');
    expect(p.schemas.WorkoutProgram).toBeDefined();
    expect(p.schemas.UserProfile).toBeDefined();
    expect(p.schemas.SessionReport).toBeDefined();
    expect(p.examples.WorkoutProgram).toBeDefined();
    expect(Array.isArray(p.notes)).toBe(true);
  });
});

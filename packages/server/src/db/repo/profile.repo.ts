import type { DB } from '../connection.js';
import type { UserProfile } from '@coach/shared';

export function getProfile(db: DB): UserProfile | null {
  const row = db.prepare('SELECT data_json FROM profile WHERE id = 1').get() as
    | { data_json: string }
    | undefined;
  if (!row) return null;
  return JSON.parse(row.data_json) as UserProfile;
}

export function upsertProfile(db: DB, profile: UserProfile): UserProfile {
  const json = JSON.stringify(profile);
  db.prepare(
    `INSERT INTO profile (id, data_json, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`,
  ).run(json, profile.updated_at);
  return profile;
}

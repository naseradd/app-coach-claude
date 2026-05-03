import { buildSchemaPayload } from '@coach/shared';
import type { DB } from '../../db/connection.js';

export const getSchemaTool = {
  name: 'get_schema',
  description:
    "Retourne le JSON Schema (généré depuis Zod) et un exemple complet valide pour WorkoutProgram, UserProfile, et SessionReport. **Appelle cet outil EN PREMIER quand l'utilisateur te demande de générer un programme** ou de mettre à jour son profil — il te donne la forme exacte à respecter et des exemples copiables. Le payload reflète toujours la version courante du serveur (pas de drift possible).",
  inputSchema: {
    type: 'object' as const,
    properties: {},
    additionalProperties: false,
  },
  handler:
    (_db: DB) =>
    async (): Promise<{ content: { type: 'text'; text: string }[] }> => ({
      content: [{ type: 'text', text: JSON.stringify(buildSchemaPayload()) }],
    }),
};

import { WorkoutProgramSchema, type WorkoutProgram } from '../schemas'
import { ZodError } from 'zod'

export type ImportResult =
  | { success: true; program: WorkoutProgram }
  | { success: false; errors: string[] }

export function parseProgram(raw: unknown): ImportResult {
  try {
    const program = WorkoutProgramSchema.parse(raw)
    return { success: true, program }
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = (err as ZodError).issues.map((issue) => {
        const path = issue.path.join(' → ')
        return path ? `${path} : ${issue.message}` : issue.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Format JSON invalide'] }
  }
}

export function decodeProgramFromUrl(): ImportResult | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('program')
    if (!encoded) return null
    const json = JSON.parse(decodeURIComponent(atob(encoded)))
    return parseProgram(json)
  } catch {
    return { success: false, errors: ['Le paramètre URL est invalide ou corrompu'] }
  }
}

export function encodeProgramToUrl(program: WorkoutProgram, baseUrl: string): string {
  const json = JSON.stringify(program)
  const encoded = btoa(encodeURIComponent(json))
  return `${baseUrl}?program=${encoded}`
}

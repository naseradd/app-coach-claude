import type { WorkoutProgram, SessionReport } from '../schemas'

export interface CoachingContext {
  exported_at: string
  current_program: WorkoutProgram | null
  total_sessions: number
  strength_trends: Record<string, number[]>
  average_completion_rate: number
  sessions: SessionReport[]
}

export function buildCoachingContext(
  program: WorkoutProgram | null,
  reports: SessionReport[]
): CoachingContext {
  // Build strength trends per exercise
  const trends: Record<string, number[]> = {}
  for (const report of [...reports].reverse()) {
    for (const ex of report.exercises_log) {
      const workingSets = ex.sets_log.filter((s) => s.completed && s.type === 'working')
      if (workingSets.length === 0) continue
      const maxVolume = Math.max(
        ...workingSets.map((s) => (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0))
      )
      if (!trends[ex.exercise_name]) trends[ex.exercise_name] = []
      trends[ex.exercise_name].push(maxVolume)
    }
  }

  const avgCompletion =
    reports.length > 0
      ? reports.reduce((acc, r) => acc + r.completion_rate, 0) / reports.length
      : 0

  return {
    exported_at: new Date().toISOString(),
    current_program: program,
    total_sessions: reports.length,
    strength_trends: trends,
    average_completion_rate: Math.round(avgCompletion * 100) / 100,
    sessions: reports,
  }
}

export async function syncToGithub(
  context: CoachingContext,
  token: string,
  owner: string,
  repo: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const path = 'public/data/sessions-export.json'
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(context, null, 2))))

  // Get current file SHA if exists
  let sha: string | undefined
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    if (res.ok) {
      const data = await res.json()
      sha = data.sha
    }
  } catch {
    // File doesn't exist yet, that's fine
  }

  // Commit the file
  const body: Record<string, unknown> = {
    message: `chore: update sessions export [${new Date().toISOString()}]`,
    content,
    branch: 'main',
  }
  if (sha) body.sha = sha

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    return { success: false, error: err.message ?? 'GitHub API error' }
  }

  return {
    success: true,
    url: `https://${owner}.github.io/${repo}/data/sessions-export.json`,
  }
}

import { create } from 'zustand'
import type { WorkoutProgram } from '../schemas'
import { saveProgram, getLatestProgram } from '../db'

interface ProgramState {
  currentProgram: WorkoutProgram | null
  isLoading: boolean
  setProgram: (program: WorkoutProgram) => Promise<void>
  loadFromDB: () => Promise<void>
}

export const useProgramStore = create<ProgramState>((set) => ({
  currentProgram: null,
  isLoading: true,

  setProgram: async (program) => {
    await saveProgram(program)
    set({ currentProgram: program })
  },

  loadFromDB: async () => {
    set({ isLoading: true })
    const program = await getLatestProgram()
    set({ currentProgram: program ?? null, isLoading: false })
  },
}))

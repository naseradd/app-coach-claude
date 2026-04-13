import { create } from 'zustand'
import type { WorkoutProgram } from '../schemas'
import { saveProgram, getLatestProgram, getAllPrograms, getProgram, deleteProgram as dbDeleteProgram } from '../db'

interface StoredProgramEntry {
  id: string
  program: WorkoutProgram
  imported_at: string
}

interface ProgramState {
  currentProgram: WorkoutProgram | null
  allPrograms: StoredProgramEntry[]
  isLoading: boolean
  setProgram: (program: WorkoutProgram) => Promise<void>
  loadFromDB: () => Promise<void>
  switchProgram: (id: string) => Promise<void>
  deleteProgram: (id: string) => Promise<void>
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  currentProgram: null,
  allPrograms: [],
  isLoading: true,

  setProgram: async (program) => {
    await saveProgram(program)
    const all = await getAllPrograms()
    set({ currentProgram: program, allPrograms: all })
  },

  loadFromDB: async () => {
    set({ isLoading: true })
    const program = await getLatestProgram()
    const all = await getAllPrograms()
    set({ currentProgram: program ?? null, allPrograms: all, isLoading: false })
  },

  switchProgram: async (id: string) => {
    const program = await getProgram(id)
    if (program) {
      set({ currentProgram: program })
    }
  },

  deleteProgram: async (id: string) => {
    await dbDeleteProgram(id)
    const { currentProgram } = get()
    const all = await getAllPrograms()
    if (currentProgram?.program.id === id) {
      // Deleted the active program — switch to most recent remaining, or null
      set({ currentProgram: all[0]?.program ?? null, allPrograms: all })
    } else {
      set({ allPrograms: all })
    }
  },
}))

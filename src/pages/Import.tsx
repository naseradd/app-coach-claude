import { useState, useEffect, useRef } from 'react'
import { Upload, Link, CheckCircle, AlertCircle, FileJson, ClipboardPaste } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { parseProgram, decodeProgramFromUrl } from '../utils/importProgram'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export function Import() {
  const { setProgram } = useProgramStore()
  const navigate = useNavigate()

  const [pasteText,  setPasteText]  = useState('')
  const [urlText,    setUrlText]    = useState('')
  const [errors,     setErrors]     = useState<string[]>([])
  const [success,    setSuccess]    = useState(false)
  const [showUrl,    setShowUrl]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-detect URL param
  useEffect(() => {
    const result = decodeProgramFromUrl()
    if (!result) return
    if (result.success) {
      handleSuccess(result.program)
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      setErrors(result.errors)
    }
  }, [])

  async function handleSuccess(program: Parameters<typeof setProgram>[0]) {
    await setProgram(program)
    setSuccess(true)
    setTimeout(() => navigate('/'), 1400)
  }

  function handlePaste() {
    setErrors([])
    if (!pasteText.trim()) return
    try {
      const raw = JSON.parse(pasteText)
      const result = parseProgram(raw)
      if (result.success) handleSuccess(result.program)
      else setErrors(result.errors)
    } catch {
      setErrors(['JSON invalide — vérifie la syntaxe'])
    }
  }

  function handleUrlImport() {
    setErrors([])
    try {
      const url = new URL(urlText)
      const encoded = url.searchParams.get('program')
      if (!encoded) { setErrors(['Aucun paramètre "program" trouvé dans l\'URL']); return }
      const json = JSON.parse(decodeURIComponent(atob(encoded)))
      const result = parseProgram(json)
      if (result.success) handleSuccess(result.program)
      else setErrors(result.errors)
    } catch {
      setErrors(['URL invalide ou format non reconnu'])
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErrors([])
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)
        const result = parseProgram(raw)
        if (result.success) handleSuccess(result.program)
        else setErrors(result.errors)
      } catch {
        setErrors(['Fichier JSON invalide'])
      }
    }
    reader.readAsText(file)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-5">
        <CheckCircle size={56} className="text-win" strokeWidth={1.5} />
        <div className="text-center">
          <p className="font-condensed text-2xl font-bold text-white">Programme importé !</p>
          <p className="text-muted text-sm mt-1 font-condensed">Redirection en cours…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-condensed font-bold text-2xl text-white tracking-wide">Importer un programme</h1>
        <p className="text-sm text-muted mt-1 font-condensed">Colle le JSON généré par Claude.</p>
      </div>

      {/* ─── Primary: Paste JSON ─── */}
      <div className="space-y-3">
        <p className="text-[10px] font-condensed tracking-widest uppercase text-muted flex items-center gap-1.5">
          <ClipboardPaste size={11} />
          Coller le JSON
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'{\n  "program": { ... },\n  "sessions": [ ... ]\n}'}
          className="w-full bg-surface-2 border border-edge focus:border-lime/50 rounded-xl px-4 py-3 text-xs text-[#EEEEFF] placeholder:text-faint outline-none transition-colors font-mono min-h-[180px] resize-none"
        />
        <button
          onClick={handlePaste}
          disabled={!pasteText.trim()}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-condensed font-bold text-base tracking-wide transition-all active:scale-[0.98] ${
            pasteText.trim()
              ? 'bg-lime text-[#08080F] hover:bg-lime-bright'
              : 'bg-surface-2 text-faint border border-edge cursor-not-allowed'
          }`}
        >
          <Upload size={18} />
          Importer le programme
        </button>
      </div>

      {/* ─── Divider ─── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-edge" />
        <span className="text-[10px] font-condensed tracking-widest uppercase text-faint">ou</span>
        <div className="flex-1 h-px bg-edge" />
      </div>

      {/* ─── Secondary methods ─── */}
      <div className="grid grid-cols-2 gap-3">
        {/* File */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-surface-2 border border-edge hover:border-lime/30 transition-all active:scale-[0.97]"
        >
          <FileJson size={22} className="text-muted" />
          <span className="text-xs font-condensed font-semibold text-muted tracking-wide">Fichier JSON</span>
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />

        {/* URL */}
        <button
          onClick={() => setShowUrl((v) => !v)}
          className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border transition-all active:scale-[0.97] ${
            showUrl
              ? 'bg-lime/5 border-lime/30 text-lime'
              : 'bg-surface-2 border-edge hover:border-lime/30'
          }`}
        >
          <Link size={22} className={showUrl ? 'text-lime' : 'text-muted'} />
          <span className={`text-xs font-condensed font-semibold tracking-wide ${showUrl ? 'text-lime' : 'text-muted'}`}>
            Via URL
          </span>
        </button>
      </div>

      {/* URL input (expandable) */}
      {showUrl && (
        <div className="space-y-3 animate-slide-up">
          <input
            type="url"
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder="https://…?program=eyJ…"
            className="w-full bg-surface-2 border border-edge focus:border-lime/50 rounded-xl px-4 py-3 text-sm text-[#EEEEFF] placeholder:text-faint outline-none transition-colors"
          />
          <Button fullWidth onClick={handleUrlImport} disabled={!urlText.trim()}>
            Importer depuis l'URL
          </Button>
          <div className="bg-surface-2 rounded-xl p-3 border border-edge">
            <p className="text-xs text-muted font-condensed">
              Claude peut générer un lien direct de la forme&nbsp;:
            </p>
            <p className="text-[11px] text-lime/80 font-mono mt-1 break-all">
              https://naseradd.github.io/app-coach-claude/?program=eyJ…
            </p>
            <p className="text-xs text-muted font-condensed mt-1">
              Ouvre ce lien depuis le chat — le programme s'importe automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-loss/10 border border-loss/30 rounded-2xl p-4 space-y-2 animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-loss flex-shrink-0" />
            <p className="text-sm font-condensed font-semibold text-loss">Erreurs de validation</p>
          </div>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-loss/80 font-mono">· {e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

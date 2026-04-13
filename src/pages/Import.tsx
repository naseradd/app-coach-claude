import { useState, useEffect, useRef } from 'react'
import { Upload, Link, CheckCircle, AlertCircle, FileJson, ClipboardPaste, Clipboard } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center flex-1 gap-5 bg-bg">
        <CheckCircle size={56} className="text-green" strokeWidth={1.5} />
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-text">Programme importé !</p>
          <p className="text-muted text-sm mt-1 font-condensed">Redirection en cours…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 bg-bg space-y-5" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-text tracking-wide" style={{ fontWeight: 800 }}>Importer un programme</h1>
        <p className="text-sm text-muted mt-1 font-condensed">Colle le JSON généré par Claude.</p>
      </div>

      {/* Primary: Paste JSON */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-condensed tracking-widest uppercase text-muted flex items-center gap-1.5">
            <ClipboardPaste size={11} />
            Coller le JSON
          </p>
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText()
                if (text) setPasteText(text)
              } catch {
                setErrors(['Accès au presse-papiers refusé'])
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-condensed font-semibold text-muted hover:text-text hover:border-accent/30 transition-all active:scale-95"
          >
            <Clipboard size={13} />
            Coller
          </button>
        </div>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'{\n  "program": { ... },\n  "sessions": [ ... ]\n}'}
          className="w-full bg-surface border border-border focus:border-accent/30 rounded-xl px-4 py-3 text-xs text-text placeholder:text-faint outline-none transition-colors font-mono min-h-[180px] resize-none shadow-sm"
        />
        <button
          onClick={handlePaste}
          disabled={!pasteText.trim()}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-condensed font-bold text-base tracking-wide transition-all active:scale-[0.98] ${
            pasteText.trim()
              ? 'bg-accent text-white hover:bg-[#2a2a2a] shadow-sm'
              : 'bg-surface-2 text-faint border border-border cursor-not-allowed'
          }`}
        >
          <Upload size={18} />
          Importer le programme
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] font-condensed tracking-widest uppercase text-faint">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Secondary methods */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-surface border border-border hover:border-accent/20 shadow-sm transition-all active:scale-[0.97]"
        >
          <FileJson size={22} className="text-muted" />
          <span className="text-xs font-condensed font-semibold text-muted tracking-wide">Fichier JSON</span>
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />

        <button
          onClick={() => setShowUrl((v) => !v)}
          className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border shadow-sm transition-all active:scale-[0.97] ${
            showUrl
              ? 'bg-accent/5 border-accent/30 text-accent'
              : 'bg-surface border-border hover:border-accent/20'
          }`}
        >
          <Link size={22} className={showUrl ? 'text-accent' : 'text-muted'} />
          <span className={`text-xs font-condensed font-semibold tracking-wide ${showUrl ? 'text-text' : 'text-muted'}`}>
            Via URL
          </span>
        </button>
      </div>

      {/* URL input */}
      {showUrl && (
        <div className="space-y-3 animate-slide-up">
          <input
            type="url"
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder="https://…?program=eyJ…"
            className="w-full bg-surface border border-border focus:border-accent/30 rounded-xl px-4 py-3 text-sm text-text placeholder:text-faint outline-none transition-colors"
          />
          <Button fullWidth onClick={handleUrlImport} disabled={!urlText.trim()}>
            Importer depuis l'URL
          </Button>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-lt border border-red/30 rounded-2xl p-4 space-y-2 animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red flex-shrink-0" />
            <p className="text-sm font-condensed font-semibold text-red">Erreurs de validation</p>
          </div>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-red/80 font-mono">· {e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

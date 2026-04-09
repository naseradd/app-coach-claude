import { useState, useEffect, useRef } from 'react'
import { Upload, Link, ClipboardPaste, CheckCircle, AlertCircle } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { parseProgram, decodeProgramFromUrl } from '../utils/importProgram'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useNavigate } from 'react-router-dom'

type Tab = 'url' | 'paste' | 'file'

export function Import() {
  const { setProgram } = useProgramStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('url')
  const [pasteText, setPasteText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-detect URL param on mount
  useEffect(() => {
    const result = decodeProgramFromUrl()
    if (!result) return
    if (result.success) {
      handleSuccess(result.program)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      setErrors(result.errors)
    }
  }, [])

  async function handleSuccess(program: Parameters<typeof setProgram>[0]) {
    await setProgram(program)
    setSuccess(true)
    setTimeout(() => navigate('/'), 1500)
  }

  function handlePaste() {
    setErrors([])
    try {
      const raw = JSON.parse(pasteText)
      const result = parseProgram(raw)
      if (result.success) {
        handleSuccess(result.program)
      } else {
        setErrors(result.errors)
      }
    } catch {
      setErrors(['JSON invalide — vérifie la syntaxe'])
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
        if (result.success) {
          handleSuccess(result.program)
        } else {
          setErrors(result.errors)
        }
      } catch {
        setErrors(['Fichier JSON invalide'])
      }
    }
    reader.readAsText(file)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <CheckCircle size={48} className="text-green-500" />
        <p className="text-white font-semibold">Programme importé !</p>
        <p className="text-zinc-500 text-sm">Redirection en cours...</p>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof Link }[] = [
    { id: 'url', label: 'URL', icon: Link },
    { id: 'paste', label: 'Coller', icon: ClipboardPaste },
    { id: 'file', label: 'Fichier', icon: Upload },
  ]

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Importer un programme</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Colle le JSON généré par Claude ou ouvre un fichier.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setErrors([]) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'url' && (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-zinc-300">
            Claude peut générer un lien direct de la forme :
          </p>
          <div className="bg-zinc-800 rounded-lg p-3">
            <code className="text-xs text-orange-300 break-all">
              https://naseradd.github.io/app-coach-claude/?program=eyJ...
            </code>
          </div>
          <p className="text-sm text-zinc-400">
            Ouvre ce lien depuis le chat Claude, le programme s'importe automatiquement.
          </p>
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-xs text-zinc-500 mb-2">Ou colle l'URL ici :</p>
            <input
              type="url"
              placeholder="https://naseradd.github.io/app-coach-claude/?program=..."
              className="w-full bg-zinc-800 text-sm text-zinc-300 placeholder:text-zinc-600 rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-orange-500 transition-colors"
              onChange={(e) => {
                try {
                  const url = new URL(e.target.value)
                  const encoded = url.searchParams.get('program')
                  if (encoded) {
                    const json = JSON.parse(decodeURIComponent(atob(encoded)))
                    const result = parseProgram(json)
                    if (result.success) handleSuccess(result.program)
                    else setErrors(result.errors)
                  }
                } catch {}
              }}
            />
          </div>
        </Card>
      )}

      {tab === 'paste' && (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-zinc-300">Colle le JSON du programme ici :</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'{\n  "program": { ... },\n  "sessions": [ ... ]\n}'}
            className="w-full bg-zinc-800 text-xs text-zinc-300 placeholder:text-zinc-600 rounded-lg p-3 outline-none border border-zinc-700 focus:border-orange-500 transition-colors font-mono min-h-[200px] resize-none"
          />
          <Button fullWidth onClick={handlePaste} disabled={!pasteText.trim()}>
            Importer
          </Button>
        </Card>
      )}

      {tab === 'file' && (
        <Card className="p-6 text-center space-y-4">
          <Upload size={32} className="text-zinc-600 mx-auto" />
          <div>
            <p className="text-sm text-zinc-300">Sélectionne un fichier JSON</p>
            <p className="text-xs text-zinc-600 mt-1">généré par Claude</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFile}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()}>
            <Upload size={16} />
            Choisir un fichier
          </Button>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="p-4 border-red-900 bg-red-950/30">
          <div className="flex gap-2 mb-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-300">Erreurs de validation</p>
          </div>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-red-400 font-mono">· {e}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

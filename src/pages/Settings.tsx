import { useState, useEffect } from 'react'
import { GitBranch, Key, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { getSetting, setSetting, deleteSetting } from '../db'
import { getAllReports } from '../db'
import { useProgramStore } from '../store/program.store'
import { buildCoachingContext, syncToGithub } from '../utils/exportContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const REPO_OWNER = 'naseradd'
const REPO_NAME = 'app-coach-claude'
const EXPORT_URL = `https://${REPO_OWNER}.github.io/${REPO_NAME}/data/sessions-export.json`

export function Settings() {
  const { currentProgram } = useProgramStore()
  const [token, setToken] = useState('')
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    getSetting('gh_token').then((t) => {
      if (t) setSavedToken(t)
    })
  }, [])

  async function saveToken() {
    if (!token.trim()) return
    await setSetting('gh_token', token.trim())
    setSavedToken(token.trim())
    setToken('')
    setMsg({ ok: true, text: 'Token enregistré' })
  }

  async function removeToken() {
    await deleteSetting('gh_token')
    setSavedToken(null)
    setMsg({ ok: true, text: 'Token supprimé' })
  }

  async function handleSync() {
    const t = savedToken
    if (!t) {
      setMsg({ ok: false, text: 'Ajoute un token GitHub d\'abord' })
      return
    }
    setSyncing(true)
    setMsg(null)
    const reports = await getAllReports()
    const ctx = buildCoachingContext(currentProgram, reports)
    const res = await syncToGithub(ctx, t, REPO_OWNER, REPO_NAME)
    setSyncing(false)
    if (res.success) {
      setMsg({ ok: true, text: 'Sync réussi — Claude peut maintenant lire tes données.' })
    } else {
      setMsg({ ok: false, text: res.error ?? 'Erreur GitHub API' })
    }
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-24 space-y-5">
      <h1 className="text-xl font-bold text-white">Réglages</h1>

      {/* GitHub Sync */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch size={18} className="text-zinc-400" />
          <span className="font-medium text-white text-sm">Sync GitHub Pages</span>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Exporte l'historique de tes séances vers{' '}
          <code className="text-orange-300 text-[10px]">{EXPORT_URL}</code>.
          Claude peut lire cette URL pour générer ton prochain programme.
        </p>

        {savedToken ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-green-400" />
                <span className="text-xs text-zinc-300">
                  {showToken ? savedToken : '••••••••••••••••••••••••••••••••••••••'}
                </span>
              </div>
              <button
                onClick={() => setShowToken((v) => !v)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                {showToken ? 'Masquer' : 'Voir'}
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={removeToken}
              >
                <Trash2 size={13} />
                Supprimer
              </Button>
              <Button
                fullWidth
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sync...' : 'Sync maintenant'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Personal Access Token (scope <code className="text-orange-300">contents:write</code>)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_..."
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors"
              />
            </div>
            <a
              href={`https://github.com/settings/personal-access-tokens/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
            >
              <ExternalLink size={12} />
              Créer un token sur GitHub
            </a>
            <Button fullWidth size="sm" onClick={saveToken} disabled={!token.trim()}>
              <Key size={14} />
              Enregistrer le token
            </Button>
          </div>
        )}
      </Card>

      {/* Export URL info */}
      <Card className="p-4 space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">URL pour Claude Coach</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Donne cette URL à Claude pour qu'il lise l'historique de tes séances :
        </p>
        <div
          className="bg-zinc-800 rounded-lg p-3 cursor-pointer active:opacity-70"
          onClick={() => {
            navigator.clipboard.writeText(EXPORT_URL)
            setMsg({ ok: true, text: 'URL copiée' })
          }}
        >
          <code className="text-xs text-orange-300 break-all">{EXPORT_URL}</code>
        </div>
        <p className="text-xs text-zinc-600">Appuie pour copier</p>
      </Card>

      {/* Feedback */}
      {msg && (
        <div className={`text-xs px-3 py-2 rounded-lg ${msg.ok ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* App info */}
      <Card className="p-4">
        <p className="text-xs text-zinc-600 text-center">
          Fitness Coach · {REPO_OWNER}/{REPO_NAME}
        </p>
      </Card>
    </div>
  )
}

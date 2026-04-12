import { useState, useEffect } from 'react'
import { GitBranch, Key, Trash2, RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { getSetting, setSetting, deleteSetting, getAllReports } from '../db'
import { useProgramStore } from '../store/program.store'
import { buildCoachingContext, syncToGithub } from '../utils/exportContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const REPO_OWNER = 'naseradd'
const REPO_NAME  = 'app-coach-claude'
const EXPORT_URL = `https://${REPO_OWNER}.github.io/${REPO_NAME}/data/sessions-export.json`

export function Settings() {
  const { currentProgram } = useProgramStore()
  const [token,      setToken]      = useState('')
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [syncing,    setSyncing]    = useState(false)
  const [msg,        setMsg]        = useState<{ ok: boolean; text: string } | null>(null)
  const [showToken,  setShowToken]  = useState(false)

  useEffect(() => {
    getSetting('gh_token').then((t) => { if (t) setSavedToken(t) })
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
    if (!savedToken) { setMsg({ ok: false, text: 'Ajoute un token GitHub d\'abord' }); return }
    setSyncing(true)
    setMsg(null)
    const reports = await getAllReports()
    const ctx = buildCoachingContext(currentProgram, reports)
    const res = await syncToGithub(ctx, savedToken, REPO_OWNER, REPO_NAME)
    setSyncing(false)
    setSyncMsg(res.success
      ? { ok: true,  text: 'Sync réussi — Claude peut maintenant lire tes données.' }
      : { ok: false, text: res.error ?? 'Erreur GitHub API' }
    )
  }

  function setSyncMsg(m: { ok: boolean; text: string }) { setMsg(m) }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-28 space-y-4">
      <h1 className="font-condensed font-bold text-2xl text-white tracking-wide">Réglages</h1>

      {/* GitHub Sync */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-lime" />
          <span className="font-condensed font-bold text-white tracking-wide">Sync GitHub Pages</span>
        </div>
        <p className="text-xs text-muted font-condensed leading-relaxed">
          Exporte l'historique vers{' '}
          <span className="text-lime/80 font-mono text-[10px]">{EXPORT_URL}</span>.
          Claude peut lire cette URL pour générer ton prochain programme.
        </p>

        {savedToken ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-surface-2 border border-edge rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Key size={12} className="text-win flex-shrink-0" />
                <span className="text-xs text-muted font-condensed truncate">
                  {showToken ? savedToken : '••••••••••••••••••••••••••••••••'}
                </span>
              </div>
              <button
                onClick={() => setShowToken((v) => !v)}
                className="text-faint hover:text-white ml-2 flex-shrink-0 transition-colors"
              >
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={removeToken}>
                <Trash2 size={12} />
                Supprimer
              </Button>
              <Button fullWidth size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sync...' : 'Sync maintenant'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-condensed tracking-widest uppercase text-muted block mb-1.5">
                Personal Access Token (scope <span className="text-lime font-mono">contents:write</span>)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_..."
                className="w-full bg-surface-2 border border-edge focus:border-lime/50 rounded-xl px-3 py-2.5 text-sm text-[#EEEEFF] placeholder:text-faint outline-none transition-colors font-condensed"
              />
            </div>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-lime hover:text-lime-bright font-condensed transition-colors"
            >
              <ExternalLink size={11} />
              Créer un token sur GitHub
            </a>
            <Button fullWidth size="sm" onClick={saveToken} disabled={!token.trim()}>
              <Key size={12} />
              Enregistrer le token
            </Button>
          </div>
        )}
      </Card>

      {/* Export URL */}
      <Card className="p-4 space-y-3">
        <p className="text-[10px] font-condensed tracking-widest uppercase text-muted">URL pour Claude Coach</p>
        <p className="text-xs text-muted font-condensed">
          Donne cette URL à Claude pour qu'il lise l'historique :
        </p>
        <button
          className="w-full bg-surface-2 border border-edge rounded-xl p-3 text-left active:scale-[0.98] transition-all"
          onClick={() => { navigator.clipboard.writeText(EXPORT_URL); setMsg({ ok: true, text: 'URL copiée' }) }}
        >
          <p className="text-[11px] text-lime/80 font-mono break-all">{EXPORT_URL}</p>
        </button>
        <p className="text-[10px] text-faint font-condensed">Appuie pour copier</p>
      </Card>

      {/* Feedback */}
      {msg && (
        <div className={`text-xs px-3 py-2.5 rounded-xl font-condensed ${msg.ok ? 'bg-win/10 text-win border border-win/20' : 'bg-loss/10 text-loss border border-loss/20'}`}>
          {msg.text}
        </div>
      )}

      {/* App info */}
      <Card className="p-3">
        <p className="text-[10px] text-faint text-center font-condensed">
          Fitness Coach · {REPO_OWNER}/{REPO_NAME}
        </p>
      </Card>
    </div>
  )
}

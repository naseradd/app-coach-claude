import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  IconButton,
  ListGroup,
  ListRow,
  Segmented,
  Sheet,
  Toggle,
} from '../components/ui/index.js';
import type { ThemeId } from '../design/themes.js';
import { useSettings } from '../store/settings.store.js';
import { useProgram } from '../store/program.store.js';
import { useHistory } from '../store/history.store.js';
import { apiClient } from '../api/endpoints.js';

type SwatchTheme = Exclude<ThemeId, 'auto'>;

interface SwatchDef {
  id: SwatchTheme;
  label: string;
  bg: string;
  fg: string;
}

const SWATCHES: SwatchDef[] = [
  { id: 'warm-cream', label: 'Warm Cream', bg: '#FAF7F2', fg: '#C8553D' },
  { id: 'slate-cool', label: 'Slate Cool', bg: '#FBFBFC', fg: '#4F46E5' },
  { id: 'forest-calm', label: 'Forest Calm', bg: '#FAFBF7', fg: '#4A6741' },
  { id: 'carbon-mono', label: 'Carbon Mono', bg: '#FFFFFF', fg: '#0A0A0A' },
];

export function Settings() {
  const theme = useSettings((s) => s.theme);
  const weightUnit = useSettings((s) => s.weightUnit);
  const haptics = useSettings((s) => s.haptics);
  const persistedUrl = useSettings((s) => s.serverUrl);
  const persistedBearer = useSettings((s) => s.bearer);
  const setSettings = useSettings((s) => s.set);

  const connectionStatus = useProgram((s) => s.connectionStatus);
  const programFetch = useProgram((s) => s.fetch);
  const historyFetch = useHistory((s) => s.fetch);

  const [serverUrl, setServerUrl] = useState(persistedUrl);
  const [token, setToken] = useState(persistedBearer);
  const [copied, setCopied] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [saveFlash, setSaveFlash] = useState(false);

  // Re-sync local form state when persisted values change
  // (e.g. after Onboarding writes them, or on first hydration).
  useEffect(() => {
    setServerUrl(persistedUrl);
  }, [persistedUrl]);
  useEffect(() => {
    setToken(persistedBearer);
  }, [persistedBearer]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!saveFlash) return;
    const t = setTimeout(() => setSaveFlash(false), 1600);
    return () => clearTimeout(t);
  }, [saveFlash]);

  const setT = (id: ThemeId) => setSettings({ theme: id });

  const trimmedUrl = serverUrl.trim();
  const mcpUrl = trimmedUrl ? `${trimmedUrl.replace(/\/+$/, '')}/mcp` : '—';

  const saveConnection = () => {
    // useApiBoot picks up the change and reconnects automatically.
    setSettings({ serverUrl: trimmedUrl, bearer: token.trim() });
    setSaveFlash(true);
  };

  const onConfirmWipe = async () => {
    setWipeBusy(true);
    setWipeError(null);
    try {
      await apiClient.wipe();
      setWipeOpen(false);
      // Refresh stores so the UI immediately reflects the empty server.
      await Promise.all([programFetch(), historyFetch()]);
    } catch (e) {
      setWipeError(e instanceof Error ? e.message : 'wipe_failed');
    } finally {
      setWipeBusy(false);
    }
  };

  const statusBadge = (() => {
    if (!persistedUrl || !persistedBearer) {
      return <Badge variant="neutral">Non configuré</Badge>;
    }
    if (connectionStatus === 'connected') return <Badge variant="success">Connecté</Badge>;
    if (connectionStatus === 'disconnected') return <Badge variant="danger">Hors-ligne</Badge>;
    return <Badge variant="neutral">Connexion…</Badge>;
  })();

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <header style={{ padding: '24px 20px 16px' }}>
        <h1 className="t-large" style={{ margin: 0, color: 'var(--ink)' }}>
          Profil
        </h1>
      </header>

      <div style={{ padding: '0 20px', display: 'grid', gap: 20 }}>
        {/* Apparence */}
        <ListGroup header="apparence">
          <div style={{ padding: 16 }}>
            <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>
              Thème
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
              }}
            >
              {SWATCHES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setT(s.id)}
                  style={{
                    border:
                      theme === s.id ? '2px solid var(--accent)' : '2px solid transparent',
                    background: theme === s.id ? 'var(--accent-soft)' : 'var(--bg-tinted)',
                    padding: 10,
                    borderRadius: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'var(--ink)',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: s.bg,
                      border: '1px solid var(--separator)',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: s.fg,
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="t-footnote" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {s.label}
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setT('auto')}
                style={{
                  border: theme === 'auto' ? '2px solid var(--accent)' : '2px solid transparent',
                  background: theme === 'auto' ? 'var(--accent-soft)' : 'var(--bg-tinted)',
                  padding: 10,
                  borderRadius: 14,
                  cursor: 'pointer',
                  gridColumn: '1 / -1',
                  color: 'var(--ink)',
                  fontSize: 14,
                  fontWeight: 600,
                  minHeight: 44,
                }}
              >
                Auto · suivre le système
              </button>
            </div>
          </div>
        </ListGroup>

        {/* Préférences */}
        <ListGroup header="préférences">
          <ListRow
            label="Unité de poids"
            trailing={
              <Segmented<'kg' | 'lbs'>
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'lbs', label: 'lbs' },
                ]}
                value={weightUnit}
                onChange={(v) => setSettings({ weightUnit: v })}
                ariaLabel="Unité de poids"
              />
            }
          />
          <ListRow
            label="Haptiques"
            subtitle="Vibrations de confirmation"
            trailing={
              <Toggle
                checked={haptics}
                onChange={(v) => setSettings({ haptics: v })}
                ariaLabel="Haptiques"
              />
            }
          />
        </ListGroup>

        {/* Serveur MCP */}
        <ListGroup header="serveur mcp">
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            <div>
              <label className="t-subhead" style={{ color: 'var(--ink-3)' }}>
                URL backend
              </label>
              <input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://coach.fly.dev"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  marginTop: 6,
                  width: '100%',
                  height: 44,
                  borderRadius: 14,
                  border: '1px solid var(--separator)',
                  background: 'var(--bg-canvas)',
                  padding: '0 14px',
                  fontSize: 15,
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label className="t-subhead" style={{ color: 'var(--ink-3)' }}>
                Bearer token
              </label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type="password"
                placeholder="•••"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  marginTop: 6,
                  width: '100%',
                  height: 44,
                  borderRadius: 14,
                  border: '1px solid var(--separator)',
                  background: 'var(--bg-canvas)',
                  padding: '0 14px',
                  fontSize: 15,
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>
            <Button variant="tinted" size="md" fullWidth onClick={saveConnection}>
              {saveFlash ? 'Sauvegardé · reconnecté' : 'Sauver et reconnecter'}
            </Button>
          </div>
          <ListRow
            label="URL MCP"
            subtitle={
              <span className="tabular" style={{ wordBreak: 'break-all' }}>
                {mcpUrl}
              </span>
            }
            trailing={
              <IconButton
                ariaLabel="Copier"
                onClick={() => {
                  if (mcpUrl !== '—') {
                    navigator.clipboard?.writeText(mcpUrl).catch(() => {});
                    setCopied(true);
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </IconButton>
            }
          />
          <div style={{ padding: '4px 16px 14px' }}>{statusBadge}</div>
        </ListGroup>

        {/* Zone danger */}
        <ListGroup header="zone danger">
          <div style={{ padding: 14 }}>
            <Button
              variant="bordered"
              size="md"
              fullWidth
              onClick={() => {
                setWipeError(null);
                setWipeOpen(true);
              }}
            >
              <span style={{ color: 'var(--danger)' }}>Effacer toutes les données serveur</span>
            </Button>
          </div>
        </ListGroup>

        <Card variant="tinted" padding={14}>
          <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
            Coach Claude · v0.1.0
          </div>
          <div className="t-footnote" style={{ color: 'var(--ink-4)', marginTop: 4 }}>
            Tu exécutes. Claude apprend.
          </div>
        </Card>
      </div>

      {/* Wipe confirmation sheet (no window.confirm — looks bad on iOS standalone) */}
      <Sheet open={wipeOpen} onClose={() => (wipeBusy ? undefined : setWipeOpen(false))}>
        <div style={{ display: 'grid', gap: 12, padding: '4px 0 8px' }}>
          <h3 className="t-title-2" style={{ margin: 0 }}>
            Effacer toutes les données ?
          </h3>
          <p className="t-callout" style={{ color: 'var(--ink-3)', margin: 0 }}>
            Programme actif, profil et historique des séances seront supprimés du serveur. Cette
            action est définitive.
          </p>
          {wipeError ? (
            <div className="t-footnote" style={{ color: 'var(--danger)' }}>
              {wipeError}
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
            <Button
              variant="bordered"
              size="lg"
              fullWidth
              onClick={onConfirmWipe}
              disabled={wipeBusy}
            >
              <span style={{ color: 'var(--danger)' }}>
                {wipeBusy ? 'Suppression…' : 'Confirmer la suppression'}
              </span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setWipeOpen(false)}
              disabled={wipeBusy}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

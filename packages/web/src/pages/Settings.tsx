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
  Toggle,
} from '../components/ui/index.js';
import { applyTheme, loadTheme, type ThemeId } from '../design/themes.js';

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
  const [theme, setTheme] = useState<ThemeId>(loadTheme());
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [haptic, setHaptic] = useState(true);
  const [voice, setVoice] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const setT = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
  };

  const mcpUrl = serverUrl ? `${serverUrl.replace(/\/+$/, '')}/mcp` : '—';
  const reachable = false; // Phase 7 wires this

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
                value={unit}
                onChange={setUnit}
                ariaLabel="Unité de poids"
              />
            }
          />
          <ListRow
            label="Haptiques"
            subtitle="Vibrations de confirmation"
            trailing={<Toggle checked={haptic} onChange={setHaptic} ariaLabel="Haptiques" />}
          />
          <ListRow
            label="Voix coach"
            subtitle="Annonces sets, repos terminé"
            trailing={<Toggle checked={voice} onChange={setVoice} ariaLabel="Voix coach" />}
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
            <Button variant="tinted" size="md" fullWidth onClick={() => { /* Phase 7 */ }}>
              Sauver et reconnecter
            </Button>
          </div>
          <ListRow
            label="URL MCP"
            subtitle={<span className="tabular" style={{ wordBreak: 'break-all' }}>{mcpUrl}</span>}
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
          <div style={{ padding: '4px 16px 14px' }}>
            {!reachable ? (
              <Badge variant="danger">Hors-ligne · configure d'abord</Badge>
            ) : (
              <Badge variant="success">Connecté</Badge>
            )}
          </div>
        </ListGroup>

        {/* Zone danger */}
        <ListGroup header="zone danger">
          <div style={{ padding: 14 }}>
            <Button
              variant="bordered"
              size="md"
              fullWidth
              onClick={() => { /* Phase 7 */ }}
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
    </div>
  );
}
